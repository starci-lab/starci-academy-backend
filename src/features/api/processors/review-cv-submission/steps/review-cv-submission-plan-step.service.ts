import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
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
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import type {
    ExtendedReviewCvSubmissionContext,
    ReviewCvSubmissionExtractStepExecuteResult,
    ReviewCvSubmissionPlanStepExecuteResult,
} from "../types"
import type {
    ReviewCvSubmissionPayload,
} from "@modules/bullmq"
import {
    ReviewCvSubmissionExtractStepService 
} from "./review-cv-submission-extract-step.service"
import {
    CvSubmissionExtractEmptyTextException,
    CvSubmissionPlanEmptyTextException,
} from "@modules/exceptions"
import {
    envConfig 
} from "@modules/env"
import {
    ReviewCvSubmissionModelRouterService,
} from "@modules/ai"

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
        private readonly modelService: ModelService,
        private readonly extractStepService: ReviewCvSubmissionExtractStepService,
        private readonly reviewCvSubmissionModelRouter: ReviewCvSubmissionModelRouterService,
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
            const executionResult = await this.execute(context)
            await this.finalize(
                executionResult,
                context,
            )
        } catch (error) {
            await this.jobActionService.failJob({
                job: context.job,
                error,
            })
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
    ): Promise<ReviewCvSubmissionPlanStepExecuteResult> {
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

        const model = this.modelService.get({
            model: context.payload.analyzeModel || this.reviewCvSubmissionModelRouter.model,
            provider: context.payload.analyzeProvider || this.reviewCvSubmissionModelRouter.provider,
        })

        const response = await model.invoke([
            new SystemMessage(systemText),
            new HumanMessage(text),
        ])

        const raw = (typeof response.content === "string"
            ? response.content
            : String(response.content)) as string

        const reviewPlan = raw.trim()
        if (!reviewPlan) {
            throw new CvSubmissionPlanEmptyTextException({
                key: context.extended.cvSubmission.cdnKey,
            })
        }

        return {
            reviewPlan,
        }
    }

    /**
     * Finalize the step.
     * @param executionResult - The execution result.
     * @param context - Job context.
     */
    private async finalize(
        executionResult: ReviewCvSubmissionPlanStepExecuteResult,
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
}
