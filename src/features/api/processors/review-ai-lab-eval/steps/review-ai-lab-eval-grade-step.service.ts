import type {
    ReviewAiLabEvalPayload,
} from "@modules/bullmq"
import type {
    ReviewAiLabEvalGradeResult,
} from "../types"
import {
    AbstractStepService,
    AiLabEvalService,
    CreditUsageService,
    JobActionService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    AiQuotaExhaustedException,
} from "@modules/exceptions"
import {
    EmptyObject,
} from "@modules/common"
import {
    AiMode,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    envConfig,
} from "@modules/env"
import {
    AiEntitlementService,
    type ModelRecommendation,
    resolveGradingCreditCost,
    resolveGradingInvokeOptions,
} from "@modules/ai"

/**
 * Step 0 of the AI Lab eval-runner: resolve the submitter's AI lane, gate the
 * Auto credit pool, grade the submitted prompt template against every case in
 * the eval set via {@link AiLabEvalService.gradeEvalSet}, debit the Premium pool
 * once, and persist the verdict for the complete step to write back.
 *
 * Mirrors {@link ReviewMilestoneTaskGradeStepService}: same Auto-lane quota gate
 * and `resolveGradingInvokeOptions` resolution, but the per-case invoke +
 * metric/judge scoring is delegated to the reusable {@link AiLabEvalService}.
 */
@Injectable()
export class ReviewAiLabEvalGradeStepService extends AbstractStepService<
    ReviewAiLabEvalPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly creditUsageService: CreditUsageService,
        private readonly aiLabEvalService: AiLabEvalService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "review-ai-lab-eval-grade"

    /**
     * Process the grade step: execute then persist the execution result, failing
     * the job (and emitting the change event) on any error.
     * @param context - The job extended context carrying the eval payload.
     * @returns A promise that resolves once the grade result is persisted.
     */
    async process(
        context: JobExtendedContext<ReviewAiLabEvalPayload, EmptyObject>,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(
                context,
            )
            await this.finalize(
                executionResult,
                context,
            )
        } catch (error) {
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: error.message,
                    emitChangeEvent: true,
                },
            )
            throw error
        }
    }

    /**
     * Execute the grade step: gate quota, resolve the lane, grade the eval set,
     * and debit credits.
     * @param context - The job extended context carrying the eval payload.
     * @returns The aggregated grade result + resolved AI usage to persist.
     */
    private async execute(
        context: JobExtendedContext<ReviewAiLabEvalPayload, EmptyObject>,
    ): Promise<ReviewAiLabEvalGradeResult> {
        const { payload } = context
        // default the grading lane to Auto when the submission pinned none
        const mode = payload.ai?.mode ?? AiMode.Auto

        // Auto lane → gate on the shared credit pool before spending any tokens
        if (mode === AiMode.Auto) {
            const creditSnapshot = await this.creditUsageService.getSnapshot(payload.userId)
            if (creditSnapshot.overQuota) {
                throw new AiQuotaExhaustedException({
                    mode: AiMode.Auto,
                    window: "credit",
                })
            }
        }

        // resolve the concrete invoke options (category / pinned model / byok) for the lane
        const invokeOptions = await resolveGradingInvokeOptions(
            {
                userId: payload.userId,
                selection: payload.ai,
                aiEntitlementService: this.aiEntitlementService,
            },
        )

        // grade the submitted template against every case (per-case invoke + metric/judge)
        const grade = await this.aiLabEvalService.gradeEvalSet(
            {
                evalSetId: payload.evalSetId,
                submittedSystemPrompt: payload.submittedSystemPrompt ?? null,
                userTemplate: payload.submittedUserTemplate,
                params: payload.params,
                invokeOptions,
                locale: payload.locale ?? Locale.En,
            },
        )

        // debit the Premium tier pool once for this grading job (no-op for Auto/Byok),
        // then invalidate the cached Auto credit total so the next read sees the charge
        await this.aiEntitlementService.consume({
            userId: payload.userId,
            mode,
            cost: resolveGradingCreditCost({
                mode,
                recommendation: envConfig().ai.modelRecommendation as ModelRecommendation,
            }),
        })
        await this.creditUsageService.invalidate(payload.userId)

        return {
            grade,
            aiUsage: {
                // invoke options surface the resolved model/provider for Premium + Auto pin
                model: invokeOptions.model ?? null,
                provider: invokeOptions.provider ?? null,
                mode,
            },
        }
    }

    /**
     * Finalize the grade step: advance the job and persist the execution result.
     * @param executionResult - The grade result produced by {@link execute}.
     * @param context - The job extended context carrying the eval payload.
     * @returns A promise that resolves once the result is persisted.
     */
    private async finalize(
        executionResult: ReviewAiLabEvalGradeResult,
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
