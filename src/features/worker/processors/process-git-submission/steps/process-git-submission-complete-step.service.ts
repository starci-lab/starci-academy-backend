import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    InjectQdrantClient,
    SubmissionFeedbackEntity,
    UserChallengeSubmissionEntity,
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
import {
    QdrantClient,
} from "@qdrant/qdrant-js"

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
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
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
            || typeof grade.shortFeedback !== "string" && grade.shortFeedback !== null
            || !Array.isArray(grade.submissionFeedbacks)
        ) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        const feedbacks: Array<DeepPartial<SubmissionFeedbackEntity>> = grade.submissionFeedbacks
            .map((feedback, index) => ({
                message: feedback.message,
                detail: feedback.detail?.trim() || null,
                location: feedback.location?.trim() || null,
                suggestion: feedback.suggestion?.trim() || null,
                severity: feedback.severity,
                orderIndex: index,
                userChallengeSubmission: {
                    id: context.payload.userChallengeSubmissionId,
                },
            })
            )
        // Update scalar fields
        await this.entityManager.transaction(
            async (entityManager) => {
                // Update scalar fields
                await entityManager.update(
                    UserChallengeSubmissionEntity,
                    {
                        id: context.payload.userChallengeSubmissionId,
                    },
                    {
                        score: grade.score,
                        processed: true,
                        processedAt: this.dayjsService.now().toDate(),
                        shortFeedback: grade.shortFeedback,
                    },
                )

                // Replace structured feedback rows
                await entityManager.delete(
                    SubmissionFeedbackEntity,
                    {
                        userChallengeSubmission: {
                            id: context.payload.userChallengeSubmissionId,
                        },
                    },
                )
                // Replace structured feedback rows
                if (feedbacks.length) {
                    await entityManager.save(
                        SubmissionFeedbackEntity,
                        feedbacks,
                    )
                }
            })
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
