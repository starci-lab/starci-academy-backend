import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    JobActionService,
    CreditUsageService,
} from "@modules/bussiness"
import {
    AiMode,
    AiModelTask,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    TemplateCVEntity,
} from "@modules/databases"
import {
    AiInvokeService,
    AiEntitlementService,
    resolveGradingInvokeOptions,
} from "@modules/ai"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import type {
    CvAiInvokeDecision,
    ExtendedReviewCvSubmissionContext,
    ReviewCvSubmissionExtractStepExecuteResult,
    ReviewCvSubmissionPlanStepExecuteResult,
    ReviewCvSubmissionPlanStepExecutionResult,
} from "../types"
import {
    CV_AI_INVOKE_DECISION_KEY,
} from "../constants"
import type {
    ReviewCvSubmissionPayload,
} from "@modules/bullmq"
import {
    ReviewCvSubmissionExtractStepService 
} from "./review-cv-submission-extract-step.service"
import {
    AiQuotaExhaustedException,
    CvSubmissionExtractEmptyTextException,
    CvSubmissionPlanEmptyTextException,
} from "@modules/exceptions"
import {
    envConfig
} from "@modules/env"

/**
 * Step 1: LLM drafts a review plan (markdown) from rubric + CV text before structured scoring.
 */
@Injectable()
export class ReviewCvSubmissionPlanStepService extends AbstractStepService<
    ReviewCvSubmissionPayload,
    ExtendedReviewCvSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly extractStepService: ReviewCvSubmissionExtractStepService,
        private readonly creditUsageService: CreditUsageService,
    ) {
        super()
    }

    stepIndex = 1

    stepName = "plan"

    /**
     * Build the output language instruction from locale.
     * @param locale - Locale hint from payload.
     * @returns Language instruction for model output.
     */
    private buildLanguageInstruction(locale?: Locale): string {
        if (locale === Locale.Vi) {
            return "Write the entire response in Vietnamese."
        }

        return "Write the entire response in English."
    }

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
        try {
            const {
                executionResult,
                decision,
            } = await this.execute(context)
            await this.finalize(
                executionResult,
                decision,
                context,
            )
        } catch (error) {
            await this.jobActionService.failJob({
                job: context.job,
                error,
            })
            throw error
        }
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
    ): Promise<ReviewCvSubmissionPlanStepExecutionResult> {
        const { originalText } = await this.jobActionService.loadExecutionResult<ReviewCvSubmissionExtractStepExecuteResult>(
            {
                job: context.job,
                key: this.extractStepService.stepName,
            },
        )   
        let text = originalText || ""
        if (!text.trim()) {
            throw new CvSubmissionExtractEmptyTextException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }
        if (text.length > envConfig().cv.maxCharsPlan) {
            text = text.slice(
                0,
                envConfig().cv.maxCharsPlan,
            ) + "..."
        }

        const templateCvId = context.payload.templateCvId
        let rubricBlock: string
        if (templateCvId) {
            const templateCV = await this.entityManager.findOne(
                TemplateCVEntity,
                {
                    where: {
                        id: templateCvId,
                    },
                },
            )
            rubricBlock = templateCV
                ? [
                    "RUBRIC (follow strictly when shaping the plan):",
                    "",
                    templateCV.body,
                ].join("\n")
                : "No rubric template was found; infer a sensible seniority-appropriate review plan from the CV alone."
        } else {
            rubricBlock = [
                "No level-specific rubric was provided.",
                "Infer a concise review plan suitable for a mid-level software developer CV.",
            ].join("\n")
        }

        const systemText = [
            "You are a senior engineering mentor preparing for a CV review session.",
            "Your task now is ONLY to outline a review plan — do not score, do not output JSON.",
            this.buildLanguageInstruction(context.payload.locale),
            "",
            rubricBlock,
            "",
            "Output requirements:",
            "- Use Markdown with clear headings.",
            "- Include: (1) Scope & assumptions (2) Priority sections of the CV to discuss (3) Order of topics (4) Risks or gaps to probe (5) What a successful review should clarify for the candidate.",
            "- Keep it under ~400 words.",
            "- No JSON, no code fences wrapping the whole answer.",
        ].join("\n")

        /**
         * Resolve + debit the submitter's AI quota ONCE for the whole CV
         * review here in the plan step; analyze reuses this decision without
         * a second consume (1 CV review = 1 charge).
         */
        const decision = await this.resolveInvokeDecision(
            {
                userId: context.extended.user.id,
                payload: context.payload,
            },
        )

        const { text: raw } = await this.aiInvokeService.invoke({
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(text),
            ],
            ...decision,
            task: AiModelTask.Grading,
        })

        const reviewPlan = raw.trim()
        if (!reviewPlan) {
            throw new CvSubmissionPlanEmptyTextException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }

        return {
            executionResult: {
                reviewPlan,
            },
            decision,
        }
    }

    /**
     * Resolve the submitter's entitlement and derive + debit the AI-invoke
     * decision for this CV review (called only here in the plan step).
     *
     * - `byok`: build a BYOK descriptor from the payload (no quota debit).
     * - `auto`: debit one Economy "lượt"; grade on the Economy category.
     * - `premium`: debit + grade on the highest category the tier unlocks.
     * @param params - The resolved `userId` and the job payload.
     * @returns The {@link CvAiInvokeDecision} reused by the analyze step.
     * @throws AiQuotaExhaustedException when the user has no allowance left.
     */
    private async resolveInvokeDecision(
        {
            userId,
            payload,
        }: {
            userId: string
            payload: ReviewCvSubmissionPayload
        },
    ): Promise<CvAiInvokeDecision> {
        // CV grading needs a capable model — reject the free Auto lane (or no
        // pick at all). Only BYOK or a paid Premium subscription may grade a CV.
        if (!payload.ai || payload.ai.mode === AiMode.Auto) {
            throw new AiQuotaExhaustedException({
                mode: AiMode.Auto,
                window: "premium-required",
            })
        }

        // Premium runs on pooled credits — block before debiting when over quota.
        if (payload.ai.mode === AiMode.Premium) {
            const creditSnapshot = await this.creditUsageService.getSnapshot(userId)
            if (creditSnapshot.overQuota) {
                throw new AiQuotaExhaustedException({
                    mode: AiMode.Premium,
                    window: "credit",
                })
            }
        }

        // Build the BYOK/Premium invoke descriptor — gates entitlement (no
        // downgrade) and throws on a not-entitled lane or a missing BYOK key.
        // CV review is premium-only: `allowFreeAuto: false` forces an absent/Auto
        // pick onto the Premium lane, so an unentitled user is rejected (not graded
        // free on Qwen/economy).
        return resolveGradingInvokeOptions({
            userId,
            selection: payload.ai,
            aiEntitlementService: this.aiEntitlementService,
            allowFreeAuto: false,
        })
    }

    /**
     * Finalize the step.
     * @param executionResult - The execution result.
     * @param context - Job context.
     */
    private async finalize(
        executionResult: ReviewCvSubmissionPlanStepExecuteResult,
        decision: CvAiInvokeDecision,
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

            /** Persist the entitlement decision for the analyze step to reuse. */
            await this.jobActionService.saveExecutionResult<CvAiInvokeDecision>({
                job,
                key: CV_AI_INVOKE_DECISION_KEY,
                executionResult: decision,
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

