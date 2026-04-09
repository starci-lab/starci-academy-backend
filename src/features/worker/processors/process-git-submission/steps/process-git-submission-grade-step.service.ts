import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ModelProvider,
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
    ProcessGitSubmissionGradeStepExecuteResult,
    ProcessGitSubmissionPrepareDocsStepExecuteResult,
} from "../types"
import {
    JobExtendedContext,
} from "../../types"
import {
    Document,
} from "@langchain/core/documents"
import {
    ProcessGitSubmissionPrepareDocsStepService,
} from "./process-git-submission-prepare-docs-step.service"
import {
    envConfig,
} from "@modules/env"
import {
    ModelService,
} from "@modules/langchain"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    InvalidModelGradeScoreException,
    ParsingScoreFromModelTextException,
} from "@modules/exceptions"
import fs from "fs"

/**
 * Step 4: grade the submission.
 */
@Injectable()
export class ProcessGitSubmissionGradeStepService extends AbstractStepService<
    ProcessGitSubmissionPayload,
    ExtendedProcessGitSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly processGitSubmissionPrepareDocsStepService: ProcessGitSubmissionPrepareDocsStepService,
        private readonly modelService: ModelService,
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
    stepName = "grade"

    /**
     * Process the step.
     * @param context - The context of the step.
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
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is executed.
     */
    private async execute(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<ProcessGitSubmissionGradeStepExecuteResult> {
        const executionResult = await this.jobActionService.loadExecutionResult<ProcessGitSubmissionPrepareDocsStepExecuteResult>(
            {
                job: context.job,
                key: this.processGitSubmissionPrepareDocsStepService.stepName,
            },
        )
        fs.writeFileSync("executionResult.json", JSON.stringify(executionResult, null, 2))
        throw new Error("test")
        const chunks = executionResult.chunks.map(
            (chunk) =>
                new Document({
                    pageContent: chunk.pageContent,
                    metadata: chunk.metadata,
                    id: chunk.id,
                }),
        )

        let sourceExcerpt = chunks
            .map((chunk) => chunk.pageContent)
            .join("\n\n")

        const maxChars =
            envConfig().services.githubWorker.processGitSubmission
                .gradingMaxSourceChars

        if (sourceExcerpt.length > maxChars) {
            sourceExcerpt = sourceExcerpt.slice(
                0,
                maxChars,
            )
        }

        const rubric = (context.extended?.prompts ?? [])
            .map(
                (
                    prompt,
                    index,
                ) => {
                    const label = prompt.title
                        ? ` (${prompt.title})`
                        : ""
                    return `### Criterion ${index + 1}${label}\n${prompt.promptText}`
                },
            )
            .join("\n\n")

        const systemText = [
            "You are an expert principal developer grading a learner's submitted GitHub repository for a programming course.",
            "Apply the following rubric (stored in the course database).",
            "",
            rubric || "No rubric provided.",
            "",
            "Respond with JSON only — no markdown fences, no extra text.",
            "Shape:",
            "{\"score\": <integer from 1 to 20>, \"feedbacks\": [\"<short actionable feedback>\"]}",
            "Rules:",
            "- score must be a whole number from 1 (poor) to 20 (excellent).",
            "- feedbacks must be an array of concise, specific, actionable comments.",
            "- every feedback item must be grounded only in the submitted repository excerpt.",
            "- do not invent files, features, or behaviors not present in the excerpt.",
            "- return 2 to 5 feedback items.",
            "- each feedback item should be a single sentence when possible.",
        ].join("\n")

        const humanText = [
            "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
            "",
            sourceExcerpt || "(empty repository excerpt)",
        ].join("\n")

        const model = this.modelService.get({
            model:
                context.payload.gradingModel ??
                envConfig().services.githubWorker.processGitSubmission.grading.model,
            provider:
                (context.payload.gradingProvider ??
                    envConfig().services.githubWorker.processGitSubmission.grading.provider) as ModelProvider,
        })

        const response = await model.invoke(
            [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ]
        )

        const raw = (typeof response.content === "string"
            ? response.content
            : String(response.content)) as string

        return this.parseGradeFromModelText(raw)
    }

    /**
     * Finalize the step.
     * @param executionResult - Execution result of the step.
     * @param context - Context of the step.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        executionResult: ProcessGitSubmissionGradeStepExecuteResult,
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

    /**
     * Parse the grade from the model text.
     * @param text - The text to parse the grade from.
     * @returns The parsed grade result.
     */
    private parseGradeFromModelText(
        text: string,
    ): ProcessGitSubmissionGradeStepExecuteResult {
        const brace = text.match(/\{[\s\S]*?\}/)

        if (brace) {
            try {
                const parsed = JSON.parse(brace[0]) as {
                    score?: unknown
                    feedbacks?: unknown
                }

                const score = this.parseScore(parsed.score)
                const feedbacks = this.parseFeedbacks(parsed.feedbacks)

                return {
                    score,
                    feedbacks,
                }
            } catch {
                // fall through
            }
        }

        throw new ParsingScoreFromModelTextException({
            text,
        })
    }

    /**
     * Parse score from unknown model output.
     * @param value - Raw score value.
     * @returns Parsed and clamped score.
     */
    private parseScore(
        value: unknown,
    ): number {
        if (typeof value === "number") {
            return this.clampScore(value)
        }

        if (typeof value === "string") {
            const parsed = Number.parseInt(
                value,
                10,
            )
            if (!Number.isNaN(parsed)) {
                return this.clampScore(parsed)
            }
        }

        throw new InvalidModelGradeScoreException({
            rawValue: value,
        })
    }

    /**
     * Parse feedbacks from unknown model output.
     * @param value - Raw feedbacks value.
     * @returns Normalized feedback array.
     */
    private parseFeedbacks(
        value: unknown,
    ): Array<string> {
        if (Array.isArray(value)) {
            return value
                .filter((item): item is string => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean)
        }

        if (typeof value === "string") {
            const trimmed = value.trim()
            return trimmed
                ? [trimmed]
                : []
        }

        return []
    }

    /**
     * Clamp the score to the range of 1 to 20.
     * @param value - The score to clamp.
     * @returns The clamped score.
     */
    private clampScore(
        value: number,
    ): number {
        return Math.min(
            20,
            Math.max(
                1,
                Math.round(value),
            ),
        )
    }
}