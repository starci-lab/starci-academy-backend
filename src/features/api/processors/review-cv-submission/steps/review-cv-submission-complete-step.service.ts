import {
    AbstractStepService,
    JobActionService,
    JobExtendedContext,
} from "@modules/bussiness"
import type {
    ReviewCvSubmissionPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
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
} from "@modules/exceptions"
import {
    ReviewCvSubmissionPlanStepService 
} from "./review-cv-submission-plan-step.service"
import {
    DayjsService,
} from "@modules/mixin"

/**
 * Step 3: load analyze execution result, persist canonical attempt (or update staging), advance job.
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
        const executionResult = await this.execute(context)
        await this.finalize(
            executionResult,
            context,
        )
    }

    /**
     * Execute the step.
     * @param context - Job context.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<
            ReviewCvSubmissionPayload,
            ExtendedReviewCvSubmissionContext
        >,
    ): Promise<EmptyObject> {
        const { detailFeedback } = await this.jobActionService.loadExecutionResult<ReviewCvSubmissionAnalyzeStepExecuteResult>(
            {
                job: context.job,
                key: this.analyzeStepService.stepName,
            },
        )
        const { originalText } = await this.jobActionService.loadExecutionResult<ReviewCvSubmissionExtractStepExecuteResult>(
            {
                job: context.job,
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
                job: context.job,
                key: this.planStepService.stepName,
            },
        )
        if (!reviewPlan || typeof reviewPlan !== "string" || !reviewPlan.trim()) {
            throw new CvSubmissionPlanEmptyTextException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }
        const attemptCount = await this.entityManager.count(
            UserCVSubmissionAttemptEntity,
            {
                where: {
                    cvSubmissionId: context.payload.cvSubmissionId,
                },
            },
        )
        const attemptNumber = attemptCount + 1
        if (!detailFeedback || typeof detailFeedback !== "string" || !detailFeedback.trim()) {
            throw new CvSubmissionAnalyzeEmptyDetailFeedbackException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }
        const cdnDir = context.extended.cvSubmission.cdnKey.split("/").slice(0,
            -1).join("/")
        const fileName = context.extended.cvSubmission.cdnKey.split("/").pop()
        if (!fileName || !fileName.trim()) {
            throw new CvSubmissionExtractEmptyFileNameException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }
        const destKey = `${cdnDir}/attempts/${attemptNumber}/${fileName}`
        await this.s3CopyService.copySameBucket({
            sourceKey: context.extended.cvSubmission.cdnKey,
            destKey,
            provider: S3Provider.Minio, 
        })

        await this.entityManager.transaction(
            async (entityManager) => {
                await entityManager.save(
                    UserCVSubmissionAttemptEntity,
                    {
                        cvSubmissionId: context.payload.cvSubmissionId,
                        attemptNumber,
                        cdnKey: destKey,
                        detailFeedback,
                        originalText,
                        reviewPlan,
                        processedAt: this.dayjsService.now(),
                        templateCv: {
                            id: context.payload.templateCvId,
                        }
                    },
                )
            }
        )
        return {
        }
    }

    /**
     * Finalize the step.
     * @param executionResult - The execution result.
     * @param context - Job context.
     */
    private async finalize(
        executionResult: EmptyObject,
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

        await this.entityManager.transaction(async (entityManager) => {
            await this.jobActionService.increaseJob({
                job,
                entityManager,
            })
            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult,
                entityManager,
            })
        })

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
    }
}
