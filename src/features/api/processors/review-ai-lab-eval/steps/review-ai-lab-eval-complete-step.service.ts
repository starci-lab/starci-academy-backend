import type {
    ReviewAiLabEvalPayload,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    AiLabEvalCaseResultEntity,
    AiLabEvalRunEntity,
    AiLabEvalRunStatus,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
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
    ReviewAiLabEvalGradeStepService,
} from "./review-ai-lab-eval-grade-step.service"
import type {
    ReviewAiLabEvalGradeResult,
} from "../types"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/exceptions"

/**
 * Step 1 of the AI Lab eval-runner: write the grade verdict back onto the
 * {@link AiLabEvalRunEntity} (status `Completed`, total/max score, passed,
 * resolved model/provider/lane) and persist one {@link AiLabEvalCaseResultEntity}
 * per graded case, all in a single transaction.
 *
 * The job-status change event the FE relies on is emitted by the worker's
 * `completeJob` call, so this step does NOT emit it itself — mirroring the
 * milestone-task complete step's reuse of the existing job-notifications socket.
 */
@Injectable()
export class ReviewAiLabEvalCompleteStepService extends AbstractStepService<
    ReviewAiLabEvalPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly gradeStepService: ReviewAiLabEvalGradeStepService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "complete"

    /**
     * Process the complete step: execute then persist the (empty) step result.
     * @param context - The job extended context carrying the eval payload.
     * @returns A promise that resolves once the verdict is written back.
     */
    async process(
        context: JobExtendedContext<ReviewAiLabEvalPayload, EmptyObject>,
    ): Promise<void> {
        const executionResult = await this.execute(
            context,
        )
        await this.finalize(
            executionResult,
            context,
        )
    }

    /**
     * Execute the complete step: load the grade result and write it back onto the
     * eval run + per-case result rows in one transaction.
     * @param context - The job extended context carrying the eval payload.
     * @returns An empty object (this step produces no further result).
     */
    private async execute(
        context: JobExtendedContext<ReviewAiLabEvalPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const { payload } = context
        // load the grade step's persisted execution result for this job
        const grade = await this.jobActionService.loadExecutionResult<ReviewAiLabEvalGradeResult>(
            {
                job: context.job,
                key: this.gradeStepService.stepName,
            },
        )
        // guard against a missing / malformed grade result before writing the verdict
        if (!grade) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        if (
            typeof grade.grade !== "object"
            || typeof grade.grade.passed !== "boolean"
            || !Array.isArray(grade.grade.caseResults)
        ) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        await this.entityManager.transaction(
            async (entityManager) => {
                // write the aggregated verdict + resolved AI usage onto the eval run row
                await entityManager.update(
                    AiLabEvalRunEntity,
                    {
                        id: payload.evalRunId,
                    },
                    {
                        status: AiLabEvalRunStatus.Completed,
                        totalScore: grade.grade.totalScore,
                        maxScore: grade.grade.maxScore,
                        passed: grade.grade.passed,
                        model: grade.aiUsage.model,
                        provider: grade.aiUsage.provider,
                        mode: grade.aiUsage.mode,
                    },
                )
                // replace any prior case results for this run (re-grade safety), then insert fresh ones
                await entityManager.delete(
                    AiLabEvalCaseResultEntity,
                    {
                        evalRun: {
                            id: payload.evalRunId,
                        },
                    },
                )
                // map each per-case grade result to a persisted case-result row
                const caseResults = grade.grade.caseResults.map(
                    (caseResult) =>
                        entityManager.create(
                            AiLabEvalCaseResultEntity,
                            {
                                evalRun: {
                                    id: payload.evalRunId,
                                },
                                evalCase: {
                                    id: caseResult.evalCaseId,
                                },
                                orderIndex: caseResult.orderIndex,
                                actualOutput: caseResult.actualOutput,
                                metricScore: caseResult.metricScore,
                                judgeScore: caseResult.judgeScore,
                                passed: caseResult.passed,
                                citationPresent: caseResult.citationPresent,
                                feedback: caseResult.feedback,
                            },
                        ),
                )
                await entityManager.save(
                    AiLabEvalCaseResultEntity,
                    caseResults,
                )
            }
        )
        return {
        }
    }

    /**
     * Finalize the complete step: advance the job and persist the step result.
     * @param executionResult - The empty result produced by {@link execute}.
     * @param context - The job extended context carrying the eval payload.
     * @returns A promise that resolves once the step is recorded.
     */
    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<ReviewAiLabEvalPayload, EmptyObject>,
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
            WinstonLog.ProcessStepExecuted,
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
