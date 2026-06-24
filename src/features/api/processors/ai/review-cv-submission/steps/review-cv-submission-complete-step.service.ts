import {
    AbstractStepService,
    EnqueueSendMailJobService,
    JobActionService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
import {
    enqueueLearnerEmail,
} from "@modules/transactional-email"
import type {
    ReviewCvSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserCVSubmissionAttemptEntity,
} from "@modules/databases"
import {
    S3CopyService,
    S3Provider,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    QueryFailedError,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ReviewCvSubmissionAnalyzeStepService,
} from "./review-cv-submission-analyze-step.service"
import type {
    ExtendedReviewCvSubmissionContext,
    ReviewCvSubmissionAnalyzeStepExecuteResult,
    ReviewCvSubmissionExtractStepExecuteResult,
    ReviewCvSubmissionPlanStepExecuteResult,
} from "../types"
import {
    ReviewCvSubmissionExtractStepService,
} from "./review-cv-submission-extract-step.service"
import {
    CvSubmissionAnalyzeEmptyDetailFeedbackException,
    CvSubmissionExtractEmptyFileNameException,
    CvSubmissionExtractEmptyTextException,
    CvSubmissionPlanEmptyTextException,
    JobFencedOutException,
} from "@modules/exceptions"
import {
    ReviewCvSubmissionPlanStepService
} from "./review-cv-submission-plan-step.service"
import {
    DayjsService,
} from "@modules/mixin"

/** Postgres unique-violation SQLSTATE — a concurrent duplicate lost the idempotency race. */
const PG_UNIQUE_VIOLATION = "23505"

/**
 * Step 3: load analyze result, copy the file to its attempt path, then ATOMICALLY persist the
 * canonical attempt and advance the job in ONE transaction. The attempt carries
 * `idempotencyKey = job.id`, so a retried/stalled job cannot produce a duplicate version.
 */
@Injectable()
export class ReviewCvSubmissionCompleteStepService extends AbstractStepService<
    ReviewCvSubmissionPayload,
    ExtendedReviewCvSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly s3CopyService: S3CopyService,
        private readonly analyzeStepService: ReviewCvSubmissionAnalyzeStepService,
        private readonly extractStepService: ReviewCvSubmissionExtractStepService,
        private readonly planStepService: ReviewCvSubmissionPlanStepService,
        private readonly dayjsService: DayjsService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    stepIndex = 3

    stepName = "complete"

    /**
     * Process the step.
     * @param context - Job context.
     */
    async process(
        context: JobExtendedContext<
            ReviewCvSubmissionPayload,
            ExtendedReviewCvSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        const {
            detailFeedback,
            score,
        } = await this.jobActionService.loadExecutionResult<ReviewCvSubmissionAnalyzeStepExecuteResult>(
            {
                job,
                key: this.analyzeStepService.stepName,
            },
        )
        const { originalText } = await this.jobActionService.loadExecutionResult<ReviewCvSubmissionExtractStepExecuteResult>(
            {
                job,
                key: this.extractStepService.stepName,
            },
        )
        if (!originalText || typeof originalText !== "string" || !originalText.trim()) {
            throw new CvSubmissionExtractEmptyTextException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }
        const { reviewPlan } = await this.jobActionService.loadExecutionResult<ReviewCvSubmissionPlanStepExecuteResult>(
            {
                job,
                key: this.planStepService.stepName,
            },
        )
        if (!reviewPlan || typeof reviewPlan !== "string" || !reviewPlan.trim()) {
            throw new CvSubmissionPlanEmptyTextException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }
        if (!detailFeedback || typeof detailFeedback !== "string" || !detailFeedback.trim()) {
            throw new CvSubmissionAnalyzeEmptyDetailFeedbackException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }

        // idempotency short-circuit: a prior atomic run already produced the canonical
        // attempt (and advanced the step), so there is nothing left to copy or persist.
        const alreadyDone = await this.entityManager.findOne(
            UserCVSubmissionAttemptEntity,
            {
                where: {
                    idempotencyKey: job.id,
                },
                select: {
                    id: true,
                },
            },
        )
        if (alreadyDone) {
            return
        }

        const attemptCount = await this.entityManager.count(
            UserCVSubmissionAttemptEntity,
            {
                where: {
                    cvSubmission: {
                        id: payload.cvSubmissionId,
                    },
                },
            },
        )
        const attemptNumber = attemptCount + 1
        const cdnDir = context.extended.cvSubmission.cdnKey.split("/").slice(0,
            -1).join("/")
        const fileName = context.extended.cvSubmission.cdnKey.split("/").pop()
        if (!fileName || !fileName.trim()) {
            throw new CvSubmissionExtractEmptyFileNameException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }
        const destKey = `${cdnDir}/attempts/${attemptNumber}/${fileName}`
        // copy the object to its attempt path BEFORE the tx (idempotent: re-copy overwrites).
        await this.s3CopyService.copySameBucket({
            sourceKey: context.extended.cvSubmission.cdnKey,
            destKey,
            provider: S3Provider.Minio,
        })

        try {
            await this.entityManager.transaction(
                async (entityManager) => {
                    /** Persist the canonical attempt + advance the step ATOMICALLY. */
                    await entityManager.save(
                        UserCVSubmissionAttemptEntity,
                        {
                            idempotencyKey: job.id,
                            cvSubmission: {
                                id: payload.cvSubmissionId,
                            },
                            attemptNumber,
                            cdnKey: destKey,
                            detailFeedback,
                            score: score ?? null,
                            originalText,
                            reviewPlan,
                            processedAt: this.dayjsService.now(),
                            templateCv: {
                                id: payload.templateCvId,
                            },
                        },
                    )
                    await this.jobActionService.increaseJob({
                        job,
                        entityManager,
                        // fence: advance only if this worker still owns the job (zombie writes rejected)
                        expectedFencingToken: job.fencingToken,
                    })
                    await this.jobActionService.saveExecutionResult({
                        job,
                        key: this.stepName,
                        executionResult: {
                        },
                        entityManager,
                    })
                }
            )
        } catch (error) {
            // a concurrent duplicate lost the unique race → already reviewed; treat as idempotent.
            if (error instanceof QueryFailedError
                && (error.driverError as { code?: string } | undefined)?.code === PG_UNIQUE_VIOLATION) {
                return
            }
            // a newer worker fenced this one out — its tx rolled back; the new owner finishes the job.
            if (error instanceof JobFencedOutException) {
                return
            }
            throw error
        }

        this.winstonService.log(
            WinstonLog.ProcessCVSubmissionStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )

        // Notify the learner — reaching here means a new attempt was persisted
        // (the `alreadyDone` short-circuit above handles retries/duplicates).
        await enqueueLearnerEmail({
            entityManager: this.entityManager,
            enqueueSendMailJobService: this.enqueueSendMailJobService,
            userId: context.extended.user.id,
            template: "cv-reviewed",
            locale: payload.locale,
            webBaseUrl: envConfig().web.baseUrl,
            subject: {
                vi: "Bản review CV của bạn đã sẵn sàng",
                en: "Your CV review is ready",
            },
            extraContext: {
                score: score ?? null,
            },
        })
    }
}
