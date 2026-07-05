import type {
    ReviewAiLabEvalPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    EnqueueSendMailJobService,
    writeActivity,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import type {
    ActivityTargetRef,
} from "@modules/databases"
import {
    ActivityType,
    AiLabEvalCaseResultEntity,
    AiLabEvalRunEntity,
    AiLabEvalRunStatus,
    ChallengeEntity,
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneTaskEntity,
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
import {
    enqueueLearnerEmail,
} from "@modules/transactional-email"

/**
 * Step 1 of the AI Lab eval-runner: write the grade verdict back onto the
 * {@link AiLabEvalRunEntity} (status `Completed`, total/max score, passed, resolved
 * model/provider/lane), persist one {@link AiLabEvalCaseResultEntity} per graded case,
 * and advance the job — all ATOMICALLY in ONE transaction. The verdict write is naturally
 * idempotent (status set + case results replaced), so a retried/stalled job re-applies the
 * same result without duplication.
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
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "complete"

    /**
     * Process the complete step: load the grade result, then write the verdict + case
     * results + job step advance in one transaction.
     * @param context - The job extended context carrying the eval payload.
     */
    async process(
        context: JobExtendedContext<ReviewAiLabEvalPayload, EmptyObject>,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        // load the grade step's persisted execution result for this job
        const grade = await this.jobActionService.loadExecutionResult<ReviewAiLabEvalGradeResult>(
            {
                job,
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
        // capture the prior status so we only email on the FIRST completion
        // (a retried/re-dispatched job re-applies the same verdict — don't re-notify)
        const priorRun = await this.entityManager.findOne(
            AiLabEvalRunEntity,
            {
                where: {
                    id: payload.evalRunId,
                },
                select: {
                    id: true,
                    status: true,
                },
            },
        )
        const wasAlreadyCompleted = priorRun?.status === AiLabEvalRunStatus.Completed
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
                    },
                )
                // home-feed activity when the eval is passed; the eval set hangs off a
                // challenge (or a milestone task) — point the token at whichever it is
                if (grade.grade.passed) {
                    const evalRun = await entityManager.findOne(
                        AiLabEvalRunEntity,
                        {
                            where: {
                                id: payload.evalRunId,
                            },
                            relations: {
                                evalSet: {
                                    challenge: true,
                                    milestoneTask: true,
                                },
                            },
                        },
                    )
                    const challenge = evalRun?.evalSet?.challenge
                    const milestoneTask = evalRun?.evalSet?.milestoneTask
                    let target: ActivityTargetRef | null = null
                    if (challenge) {
                        target = {
                            entityName: ChallengeEntity.name,
                            id: challenge.id,
                            label: challenge.title,
                        }
                    } else if (milestoneTask) {
                        target = {
                            entityName: MilestoneTaskEntity.name,
                            id: milestoneTask.id,
                            label: milestoneTask.title,
                        }
                    }
                    if (evalRun && target) {
                        await writeActivity({
                            entityManager,
                            userId: evalRun.userId,
                            type: ActivityType.AiLabPassed,
                            idempotencyKey: `aiLabPassed:${evalRun.userId}:${target.id}`,
                            metadata: {
                                target,
                            },
                        })
                    }
                }
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
                // advance the step + persist the result ATOMICALLY with the verdict write
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
                        executionResult: {
                        },
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

        // Notify the learner — only on the first completion (idempotent on retries).
        if (!wasAlreadyCompleted) {
            await enqueueLearnerEmail({
                entityManager: this.entityManager,
                enqueueSendMailJobService: this.enqueueSendMailJobService,
                userId: payload.userId,
                template: "eval-result",
                locale: payload.locale,
                webBaseUrl: envConfig().web.baseUrl,
                subject: {
                    vi: "Bài AI Lab của bạn đã được chấm",
                    en: "Your AI Lab eval was graded",
                },
                extraContext: {
                    totalScore: grade.grade.totalScore,
                    maxScore: grade.grade.maxScore,
                    passed: grade.grade.passed,
                },
            })
        }
    }
}
