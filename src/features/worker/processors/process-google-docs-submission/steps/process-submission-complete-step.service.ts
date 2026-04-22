import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    SubmissionAttemptEntity,
    SubmissionFeedbackEntity,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "@modules/bullmq"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
    ProcessGoogleDocsSubmissionCompleteStepExecuteResult,
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
} from "../types"
import type {
    JobExtendedContext,
} from "@modules/bullmq"
import {
    DayjsService,
} from "@modules/mixin"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/exceptions"
import {
    ProcessGoogleDocsSubmissionGradeStepService,
} from "./process-submission-grade-step.service"

/**
 * Step 5: persist grade and feedback to `submission_attempts`.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionCompleteStepService extends AbstractStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        private readonly processGoogleDocsSubmissionGradeStepService: ProcessGoogleDocsSubmissionGradeStepService,
    ) {
        super()
    }

    stepIndex = 1

    stepName = "complete"
    /** Process the step. */
    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        const executionResult = await this.execute(context)
        await this.finalize(
            executionResult,
            context,
        )
    }

    /** Execute the step. */
    private async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<ProcessGoogleDocsSubmissionCompleteStepExecuteResult> {
        /** Grade. */
        const grade = await this.jobActionService.loadExecutionResult<
            ProcessGoogleDocsSubmissionGradeStepExecuteResult
        >(
            {
                job: context.job,
                key: this.processGoogleDocsSubmissionGradeStepService.stepName,
            },
        )

        if (!grade || typeof grade.score !== "number" || !Array.isArray(grade.feedbacks)) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }

        const feedbackSummary = grade.feedbacks.length ? grade.feedbacks[0] : null

        await this.entityManager.transaction(async (em) => {
            const attemptCount = await em.count(
                SubmissionAttemptEntity,
                {
                    where: {
                        userChallengeSubmission: {
                            id: context.payload.userChallengeSubmissionId,
                        },
                    },
                },
            )
            const attempt = await em.save(
                SubmissionAttemptEntity,
                {
                    userChallengeSubmission: {
                        id: context.payload.userChallengeSubmissionId,
                    },
                    submissionUrl:
                        context.extended?.userChallengeSubmission.submissionUrl ?? "",
                    attemptNumber: attemptCount + 1,
                    score: grade.score,
                    processedAt: this.dayjsService.now().toDate(),
                    shortFeedback: feedbackSummary,
                },
            )

            const feedbackEntities = grade.feedbacks.map((msg, index) => {
                const entity = new SubmissionFeedbackEntity()
                entity.attempt = attempt
                entity.message = msg
                entity.orderIndex = index
                return entity
            })

            await em.save(
                SubmissionFeedbackEntity,
                feedbackEntities,
            )
        })

        return {
        }
    }

    private async finalize(
        executionResult: ProcessGoogleDocsSubmissionCompleteStepExecuteResult,
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
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
            WinstonLog.ProcessGitSubmissionStepExecuted,
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
