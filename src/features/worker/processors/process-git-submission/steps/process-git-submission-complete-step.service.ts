import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionEntity,
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
} from "../../abstracts"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionCompleteStepExecuteResult,
    ProcessGitSubmissionGradeStepExecuteResult,
} from "../types"
import type {
    JobExtendedContext,
} from "../../types"
import {
    DayjsService,
} from "@modules/mixin"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/exceptions"
import {
    ProcessGitSubmissionGradeStepService,
} from "./process-git-submission-grade-step.service"

/**
 * Step 5: persist grade and feedback to `user_challenge_submissions`.
 */
@Injectable()
export class ProcessGitSubmissionCompleteStepService extends AbstractStepService<
    ProcessGitSubmissionPayload,
    ExtendedProcessGitSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        private readonly processGitSubmissionGradeStepService: ProcessGitSubmissionGradeStepService,
    ) {
        super()
    }

    /**
     * The index of the step.
     */
    stepIndex = 4
    /**
     * The name of the step.
     */

    stepName = "complete"

    /**
     * Process the step.
     * @param context - Context of the step.
     * @returns A promise that resolves when the step is processed.
     */
    async process(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
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
     * @param context - Context of the step.
     * @returns A promise that resolves when the step is executed.
     */
    private async execute(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<ProcessGitSubmissionCompleteStepExecuteResult> {
        const grade = await this.jobActionService.loadExecutionResult<
            ProcessGitSubmissionGradeStepExecuteResult
        >(
            {
                job: context.job,
                key: this.processGitSubmissionGradeStepService.stepName,
            },
        )
        if (
            !grade
            || typeof grade.score !== "number"
            || !Array.isArray(grade.feedbacks)
        ) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        const feedbackText =
            grade.feedbacks.length
                ? grade.feedbacks.join("\n\n")
                : null
        await this.entityManager.update(
            UserChallengeSubmissionEntity,
            {
                id: context.payload.userChallengeSubmissionId,
                userId: context.payload.userId,
            },
            {
                score: grade.score,
                processed: true,
                processedAt: this.dayjsService.now().toDate(),
                feedback: feedbackText,
            },
        )
        return {
        }
    }

    /**
     * Finalize the step.
     * @param executionResult - Execution result of the step.
     * @param context - Context of the step.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        executionResult: ProcessGitSubmissionCompleteStepExecuteResult,
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    },
                )
            },
        )
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
