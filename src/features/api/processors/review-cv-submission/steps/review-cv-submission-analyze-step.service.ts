import {
    ReviewCvSubmissionModelRouterService,
} from "@modules/ai"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    JobActionService,
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
    TemplateCVEntity,
} from "@modules/databases"
import {
    ModelService,
} from "@modules/langchain"
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
    ReviewCvSubmissionAnalyzeStepExecuteResult,
    ReviewCvSubmissionExtractStepExecuteResult,
    ReviewCvSubmissionPlanStepExecuteResult,
} from "../types"
import type {
    ExtendedReviewCvSubmissionContext,
} from "../types"
import type {
    ReviewCvSubmissionPayload,
} from "@modules/bullmq"
import {
    ReviewCvSubmissionExtractStepService,
} from "./review-cv-submission-extract-step.service"
import {
    ReviewCvSubmissionPlanStepService,
} from "./review-cv-submission-plan-step.service"
import {
    ReviewCvSubmissionParseService,
} from "./parse.service"
import template from "./template.json"
import {
    CvSubmissionExtractEmptyTextException,
    CvSubmissionPlanEmptyTextException,
} from "@modules/exceptions"

const MAX_CV_CHARS = 8000

/**
 * Step 2: LLM structured analysis using **prior step execution results** (extract + plan), not a DB
 * reload of the attempt. Persists `detailFeedback` on the job for the **complete** step.
 */
@Injectable()
export class ReviewCvSubmissionAnalyzeStepService extends AbstractStepService<
    ReviewCvSubmissionPayload,
    ExtendedReviewCvSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly modelService: ModelService,
        private readonly reviewCvSubmissionModelRouter: ReviewCvSubmissionModelRouterService,
        private readonly extractStepService: ReviewCvSubmissionExtractStepService,
        private readonly planStepService: ReviewCvSubmissionPlanStepService,
        private readonly reviewCvSubmissionParseService: ReviewCvSubmissionParseService,
    ) {
        super()
    }

    stepIndex = 2

    stepName = "analyze"

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
        const executionResult = await this.execute(context)
        await this.finalize(
            executionResult,
            context,
        )
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
    ): Promise<ReviewCvSubmissionAnalyzeStepExecuteResult> {
        const { originalText } = await this.jobActionService.loadExecutionResult<ReviewCvSubmissionExtractStepExecuteResult>(
            {
                job: context.job,
                key: this.extractStepService.stepName,
            },
        )
        if (!originalText || typeof originalText !== "string" || !originalText.trim()) {
            throw new CvSubmissionExtractEmptyTextException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }

        const { reviewPlan } = await this.jobActionService.loadExecutionResult<ReviewCvSubmissionPlanStepExecuteResult>(
            {
                job: context.job,
                key: this.planStepService.stepName,
            },
        )
        if (!reviewPlan || typeof reviewPlan !== "string" || !reviewPlan.trim()) {
            throw new CvSubmissionPlanEmptyTextException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }

        let text = originalText
        if (text.length > MAX_CV_CHARS) {
            text = text.slice(
                0,
                MAX_CV_CHARS,
            ) + "..."
        }

        /**
         * Build the system prompt.
         * If a templateCvId is provided, load the template body and use it as the rubric.
         * Otherwise, fall back to the generic HR recruiter prompt.
         */
        let systemText: string

        const templateCvId = context.payload.templateCvId
        if (templateCvId) {
            const templateCV = await this.entityManager.findOne(
                TemplateCVEntity,
                {
                    where: {
                        id: templateCvId,
                    },
                },
            )
            if (templateCV) {
                const planSection = reviewPlan
                    ? [
                        "A preliminary review plan was already drafted for this CV. Follow it as the order and emphasis of your analysis; it must stay consistent with the rubric below.",
                        "",
                        "--- REVIEW PLAN ---",
                        "",
                        reviewPlan,
                        "",
                        "--- END REVIEW PLAN ---",
                        "",
                    ].join("\n")
                    : ""

                systemText = [
                    planSection,
                    templateCV.body,
                    "",
                    "---",
                    "",
                    "Given the above CV review rubric, analyze the following CV text.",
                    "",
                    this.buildJsonOutputInstructions(),
                ].join("\n")
            } else {
                const planSection = reviewPlan
                    ? [
                        "--- REVIEW PLAN ---",
                        "",
                        reviewPlan,
                        "",
                        "--- END REVIEW PLAN ---",
                        "",
                    ].join("\n")
                    : ""
                systemText = [
                    planSection,
                    this.buildDefaultSystemPrompt(),
                ].join("\n")
            }
        } else {
            const planSection = reviewPlan
                ? [
                    "Follow this review plan as the structure of your feedback:",
                    "",
                    reviewPlan,
                    "",
                    "---",
                    "",
                ].join("\n")
                : ""

            systemText = [
                planSection,
                this.buildDefaultSystemPrompt(),
            ].join("\n")
        }

        const humanText = text

        const routed = this.reviewCvSubmissionModelRouter.current
        const model = this.modelService.get({
            model: context.payload.analyzeModel ?? routed.model,
            provider: context.payload.analyzeProvider ?? routed.provider,
        })

        const response = await model.invoke([
            new SystemMessage(systemText),
            new HumanMessage(humanText),
        ])

        const raw = (typeof response.content === "string"
            ? response.content
            : String(response.content)) as string

        return this.reviewCvSubmissionParseService.parse(raw)
    }

    /**
     * Finalize the step.
     * @param executionResult - The execution result.
     * @param context - Job context.
     */
    private async finalize(
        executionResult: ReviewCvSubmissionAnalyzeStepExecuteResult,
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

    /**
     * Build the default system prompt.
     * @returns The system prompt.
     */
    private buildDefaultSystemPrompt(): string {
        return [
            "You are an expert HR recruiter and career coach.",
            "Analyze the following CV text.",
            "",
            this.buildJsonOutputInstructions(),
        ].join("\n")
    }

    /**
     * JSON schema hint for the model (mirrors `template.json`).
     */
    private buildJsonOutputInstructions(): string {
        return [
            "## Output format",
            "Respond with a single JSON object matching this template exactly (replace the placeholder with your real review; `detailFeedback` holds the full markdown):",
            "",
            JSON.stringify(
                template,
                null,
                2,
            ),
            "",
            "## JSON formatting",
            "- Output STRICT JSON only — no prose before or after the object, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- The entire markdown review lives in `detailFeedback`; escape internal quotes and newlines per JSON rules.",
        ].join("\n")
    }
}
