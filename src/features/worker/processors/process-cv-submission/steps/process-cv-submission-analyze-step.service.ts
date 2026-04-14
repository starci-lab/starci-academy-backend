import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    ProcessCVSubmissionPayload
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
    ModelProvider,
    SpellError,
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
} from "../../abstracts"
import {
    JobExtendedContext,
} from "../../types"
import type {
    ExtendedProcessCvSubmissionContext,
    ProcessCvSubmissionAnalyzeStepExecuteResult,
} from "../types"

/**
 * Shape of the JSON response expected from the LLM.
 */
interface CVAnalysisResponse {
    summary: string
    strength: string[]
    weakness: string[]
    suggested_jobs: string[]
    spell_errors: SpellError[]
    score: number
}

const MAX_CV_CHARS = 8000

/**
 * Step 1: LLM analysis of the extracted text.
 */
@Injectable()
export class ProcessCvSubmissionAnalyzeStepService extends AbstractStepService<
    ProcessCVSubmissionPayload,
    ExtendedProcessCvSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly modelService: ModelService,
    ) {
        super()
    }

    stepIndex = 1

    stepName = "analyze"

    async process(
        context: JobExtendedContext<
            ProcessCVSubmissionPayload,
            ExtendedProcessCvSubmissionContext
        >,
    ): Promise<void> {
        const executionResult = await this.execute(context)
        await this.finalize(
            executionResult,
            context,
        )
    }

    private async execute(
        context: JobExtendedContext<
            ProcessCVSubmissionPayload,
            ExtendedProcessCvSubmissionContext
        >,
    ): Promise<ProcessCvSubmissionAnalyzeStepExecuteResult> {
        const {
            cvSubmission,
            cvPrompt,
        } = context.extended!

        let text = cvSubmission.originalText || ""
        if (text.length > MAX_CV_CHARS) {
            text = text.slice(0,
                MAX_CV_CHARS) + "..."
        }

        const systemText = [
            "You are an expert HR recruiter and career coach.",
            "Analyze the following CV text and provide structured feedback in JSON format.",
            "",
            "The JSON must have the following keys:",
            "- \"summary\": A 2-3 sentence professional summary.",
            "- \"strength\": An array of 3-5 key strengths.",
            "- \"weakness\": An array of 2-4 areas for improvement.",
            "- \"suggested_jobs\": An array of 3-5 job titles that fit this profile.",
            "- \"spell_errors\": An array of spelling or obvious typo errors found (max 10). Each item is {\"word\": \"...\", \"suggestion\": \"...\", \"line\": 0}.",
            "- \"score\": A holistic score from 0 to 100.",
            "",
            "Respond ONLY with valid JSON. No markdown fences, no extra text.",
        ].join("\n")

        const humanText = (cvPrompt.promptText || "")
            .replace("{{cv_text}}",
                text) || text

        const model = this.modelService.get({
            model: context.payload.analyzeModel || "gpt-4o-mini",
            provider: context.payload.analyzeProvider || ModelProvider.OpenAI,
        })

        const response = await model.invoke([
            new SystemMessage(systemText),
            new HumanMessage(humanText),
        ])

        const raw = (typeof response.content === "string"
            ? response.content
            : String(response.content)) as string
        
        const result = this.parseJsonResult(raw)

        return {
            cvSubmission: {
                summary: result.summary,
                strength: result.strength,
                weakness: result.weakness,
                suggestedJobs: result.suggested_jobs,
                spellErrors: result.spell_errors,
                score: result.score,
                status: CvSubmissionStatus.Done,
            },
        }
    }

    private async finalize(
        executionResult: ProcessCvSubmissionAnalyzeStepExecuteResult,
        context: JobExtendedContext<
            ProcessCVSubmissionPayload,
            ExtendedProcessCvSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context

        await this.entityManager.transaction(async (entityManager) => {
            // Update CVSubmissionEntity with results and status=Done
            await entityManager.update(
                context.extended!.cvSubmission.constructor,
                context.extended!.cvSubmission.id,
                executionResult.cvSubmission,
            )

            // Advance the job (it will reach maxSteps and finish)
            await this.jobActionService.increaseJob({
                job,
                entityManager,
            })

            // Save execution result
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

    private parseJsonResult(text: string): CVAnalysisResponse {
        const first = text.indexOf("{")
        const last = text.lastIndexOf("}")
        if (first !== -1 && last !== -1 && last > first) {
            const jsonText = text.slice(first,
                last + 1)
            try {
                return JSON.parse(jsonText) as CVAnalysisResponse
            } catch (e) {
                console.error("Failed to parse LLM JSON response",
                    text)
                throw e
            }
        }
        throw new Error("Model response did not contain valid JSON.")
    }
}
