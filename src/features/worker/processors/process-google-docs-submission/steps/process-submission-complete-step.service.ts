import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    SubmissionAttemptEntity,
    SubmissionFeedbackEntity,
    JobStatus,
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
} from "../../types"
import {
    DayjsService,
} from "@modules/mixin"
import {
    MissingOrInvalidGradeExecutionResultException,
    SubmissionAttemptNotFoundException,
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

    stepIndex = 4

    stepName = "complete"

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

    private async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<ProcessGoogleDocsSubmissionCompleteStepExecuteResult> {
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

        // Find the specific attempt associated with this job
        const attempt = await this.entityManager.findOne(
            SubmissionAttemptEntity,
            {
                where: {
                    id: context.payload.submissionAttemptId,
                },
            },
        )

        if (!attempt) {
            throw new SubmissionAttemptNotFoundException({
                id: context.payload.submissionAttemptId,
            })
        }

        const feedbackSummary = grade.feedbacks.length ? grade.feedbacks[0] : null

        await this.entityManager.transaction(async (em) => {
            // 1. Update the attempt with final score and status
            await em.update(
                SubmissionAttemptEntity,
                {
                    id: attempt.id,
                },
                {
                    score: grade.score,
                    status: JobStatus.Completed,
                    processedAt: this.dayjsService.now().toDate(),
                    shortFeedback: feedbackSummary,
                },
            )

            // 2. Clear old detailed feedbacks (if any) and save new ones
            await em.delete(
                SubmissionFeedbackEntity,
                {
                    attempt: { id: attempt.id },
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

        return {}
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
