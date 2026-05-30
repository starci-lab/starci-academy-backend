import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    CreditUsageService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    AiMode,
    CreditUsageHistoryEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    ModelRecommendation,
    resolveGradingCreditCost,
} from "@modules/ai"
import {
    envConfig,
} from "@modules/env"
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
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    ProcessGitSubmissionGradeStepService,
} from "./process-git-submission-grade-step.service"
import type {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionGradeStepExecuteResult,
} from "../types"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"

/**
 * Step 1: finalize — load grade result, persist attempt + feedbacks, emit event.
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
        private readonly gradeStepService: ProcessGitSubmissionGradeStepService,
        private readonly eventEmitterService: EventEmitterService,
        private readonly dayjsService: DayjsService,
        private readonly creditUsageService: CreditUsageService,
    ) {
        super()
    }

    stepIndex = 1
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
        await this.finalize(executionResult,
            context)
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
    ): Promise<EmptyObject> {
        const { payload } = context
        const grade = await this.jobActionService.loadExecutionResult<ProcessGitSubmissionGradeStepExecuteResult>(
            {
                job: context.job,
                key: this.gradeStepService.stepName,
            },
        )
        if (!grade) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        if (typeof grade.evaluation !== "object" || typeof grade.passed !== "boolean") {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        let chargedUserId: string | undefined
        await this.entityManager.transaction(
            async (entityManager) => {
                /** Fetch all attempts for this user challenge submission */
                const numAttempts = await entityManager.count(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        where: {
                            userChallengeSubmission: {
                                id: payload.userChallengeSubmissionId,
                            },
                        },
                    },
                )
                /** Map the grade evaluation details to feedbacks */
                const feedbackRaws = grade.evaluation.details.map(
                    (detail) => {
                        return detail.feedbacks.map((feedback) => {
                            return {
                                message: feedback.message,
                                severity: feedback.severity,
                                location: feedback.location,
                                suggestion: feedback.suggestion,
                            }
                        })
                    }).flat()
                /** Map the feedbacks to the user challenge submission attempt */
                const feedbacks = feedbackRaws.map(
                    (feedback, index) => {
                        return {
                            ...feedback,
                            orderIndex: index,
                            defaultLocale: payload.locale ?? Locale.En,
                        }
                    }
                )
                /** Save the user challenge submission attempt */
                const attempt = await entityManager.save(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        userChallengeSubmission: {
                            id: payload.userChallengeSubmissionId,
                        },
                        submissionUrl:
                            context.extended?.userChallengeSubmission.submissionUrl ?? "",
                        processedAt: this.dayjsService.now().toDate(),
                        score: grade.evaluation.score,
                        shortFeedback: grade.evaluation.shortFeedback,
                        attemptNumber: numAttempts + 1,
                        defaultLocale: payload.locale ?? Locale.En,
                        feedbacks,
                    }
                )
                /** Record the AI credits charged for this grading run. */
                chargedUserId = await this.recordCreditUsage(
                    {
                        entityManager,
                        payload,
                        attemptId: attempt.id,
                    },
                )
            }
        )
        /** Refresh the cached credit total now the new charge has committed. */
        if (chargedUserId) {
            await this.creditUsageService.invalidate(chargedUserId)
        }
        return {
        }
    }

    /**
     * Persist a {@link CreditUsageHistoryEntity} row for the grading run.
     * Credits are derived from the AI lane and the configured model tier.
     * @param params - Transaction manager, job payload, and the saved attempt id.
     * @returns The id of the user that was charged.
     */
    private async recordCreditUsage(
        {
            entityManager,
            payload,
            attemptId,
        }: {
            entityManager: EntityManager
            payload: ProcessGitSubmissionPayload
            attemptId: string
        },
    ): Promise<string> {
        /** Resolve who is being charged from the user challenge submission. */
        const userChallengeSubmission = await entityManager.findOneOrFail(
            UserChallengeSubmissionEntity,
            {
                where: {
                    id: payload.userChallengeSubmissionId,
                },
            },
        )
        /** The lane the user submitted on (defaults to the free Auto lane). */
        const mode = payload.mode ?? AiMode.Auto
        /** The premium tier billed comes from the configured model recommendation. */
        const recommendation = envConfig().ai.modelRecommendation as ModelRecommendation
        const credits = resolveGradingCreditCost({
            mode,
            recommendation,
        })
        await entityManager.save(
            CreditUsageHistoryEntity,
            {
                user: {
                    id: userChallengeSubmission.userId,
                },
                attempt: {
                    id: attemptId,
                },
                mode,
                recommendation: mode === AiMode.Premium ? recommendation : null,
                credits,
            },
        )
        return userChallengeSubmission.userId
    }

    /**
     * Finalize the step.
     * @param executionResult - The execution result.
     * @param context - The context.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        executionResult: EmptyObject,
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
                    }
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    }
                )
            }
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
        this.eventEmitterService.emit({
            event: EventName.ChallengeSubmissionProgressUpdated,
            payload: {
                enrollmentId: payload.enrollmentId,
            },
        })
    }
}
