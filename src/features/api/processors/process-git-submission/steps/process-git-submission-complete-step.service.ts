import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionFeedbackEntity,
    SubmissionFeedbackSeverity,
    Locale,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import type {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionCompleteStepExecuteResult,
    ProcessGitSubmissionGradeStepExecuteResult,
} from "../types"
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
 * Step 2: persist grade and feedback to `user_challenge_submissions`.
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
    stepIndex = 1
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
        try {
            // Execute the step
            const executionResult = await this.execute(context)
            // Finalize the step
            await this.finalize(
                executionResult,
                context,
            )
        } catch (error) {
            // update the job status to failed
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: error.message,
                },
            )
            throw error
        }
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
        const executionResult = await this.jobActionService.loadExecutionResult<
            ProcessGitSubmissionGradeStepExecuteResult
        >(
            {
                job: context.job,
                key: this.processGitSubmissionGradeStepService.stepName,
            },
        )
        if (
            !executionResult
            || typeof executionResult.totalScore !== "number"
            || typeof executionResult.maxScore !== "number"
            || !Array.isArray(executionResult.requirementResults)
        ) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade: executionResult,
            })
        }
        const locale = context.payload.locale ?? Locale.En

        const feedbacks: Array<DeepPartial<UserChallengeSubmissionFeedbackEntity>> = executionResult.requirementResults
            .filter((cr) => !cr.passed)
            .map((feedback, index) => ({
                message: feedback.feedback,
                detail: null,
                location: feedback.location?.trim() || null,
                suggestion: feedback.suggestion?.trim() || null,
                severity: SubmissionFeedbackSeverity.Medium,
                orderIndex: index,
                defaultLocale: locale,
            }))
        // Update scalar fields
        await this.entityManager.transaction(
            async (entityManager) => {
                // Create a new attempt only after we have a valid grade result
                const attemptCount = await entityManager.count(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        where: {
                            userChallengeSubmission: {
                                id: context.payload.userChallengeSubmissionId,
                            },
                        },
                    },
                )
                const attempt = await entityManager.save(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        userChallengeSubmission: {
                            id: context.payload.userChallengeSubmissionId,
                        },
                        submissionUrl:
                            context.extended?.userChallengeSubmission.submissionUrl ?? "",
                        attemptNumber: attemptCount + 1,
                        score: executionResult.totalScore,
                        processedAt: this.dayjsService.now().toDate(),
                        shortFeedback: executionResult.failedRequirements === 0
                            ? "All criteria passed."
                            : `${executionResult.failedRequirements} criteria failed.`,
                        defaultLocale: locale,
                    },
                )
                // Save feedbacks linked to attempt
                if (feedbacks.length) {
                    await entityManager.save(
                        UserChallengeSubmissionFeedbackEntity,
                        feedbacks.map(
                            (feedback) => ({
                                ...feedback,
                                attempt: {
                                    id: attempt.id,
                                },
                            }
                            )
                        ),
                    )
                }
            }
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
