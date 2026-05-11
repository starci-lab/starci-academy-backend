import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    InjectQdrantClient,
    ModelProvider,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    GradeModelRouterService,
} from "@modules/ai"
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
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
    ProcessGoogleDocsSubmissionGradeStepRequirementResult,
    ExtendedProcessGoogleDocsSubmissionContext,
} from "../types"
import {
    envConfig,
} from "@modules/env"
import {
    ModelService,
    EmbeddingModelService,
} from "@modules/langchain"
import {
    GoogleDriverAPIService,
} from "@modules/googleapis"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    ParsingScoreFromModelTextException,
} from "@modules/exceptions"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import template from "./template.json"

/**
 * Step 1: grade the submission using database prompts.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionGradeStepService extends AbstractStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly googleDriverApiService: GoogleDriverAPIService,
        private readonly embeddingModelService: EmbeddingModelService,
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly modelService: ModelService,
        private readonly gradeModelRouterService: GradeModelRouterService,
        private readonly eventEmitterService: EventEmitterService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "grade"
    /** Process the step. */
    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(context)
            await this.finalize(
                executionResult,
                context,
            )
        } catch (error) {
            // update the job status to failed
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: error.message,
                },
            )
            throw error
        }
    }

    /** Execute the step. */
    private async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<ProcessGoogleDocsSubmissionGradeStepExecuteResult> {
        /** Submission URL. */
        const url = context.extended?.userChallengeSubmission.submissionUrl ?? ""
        const {
            text,
        } = await this.googleDriverApiService.fetchGoogleDocsText(
            {
                urlOrId: url,
            }
        )
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.githubWorker.processGitSubmission.chunkSize,
            chunkOverlap: envConfig().services.githubWorker.processGitSubmission.chunkOverlap,
        })
        const docs = await splitter.createDocuments(
            [
                text,
            ],
            [
                {
                    source: url,
                },
            ],
        )
        const chunks = await splitter.splitDocuments(docs)

        // Optional: vectorize into Qdrant for later inspection (not required for grading)
        const collectionName = `grading-${context.payload.userChallengeSubmissionId}`
        const embeddingModel = this.embeddingModelService.get({
            model:
                context.payload.embeddingModel ??
                envConfig().services.githubWorker.processGitSubmission.embedding.model,
            provider:
                (context.payload.embeddingProvider ??
                    envConfig().services.githubWorker.processGitSubmission.embedding.provider) as ModelProvider,
        })
        await this.qdrantClient.deleteCollection(collectionName)
        await QdrantVectorStore.fromDocuments(
            chunks,
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName,
            },
        )

        let sourceExcerpt = chunks
            .map((chunk) => chunk.pageContent)
            .join("\n\n")

        const maxChars = envConfig().services.githubWorker.processGitSubmission.gradingMaxSourceChars

        if (sourceExcerpt.length > maxChars) {
            sourceExcerpt = sourceExcerpt.slice(0,
                maxChars)
        }

        const locale = context.payload.locale ?? null
        const challenge = context.extended?.challenge
        const challengeTitle = (challenge?.title ?? "").trim()
        const requirements = challenge?.requirements ?? []

        const criteriaPromptSections = requirements
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
            .map((req, index) => {
                const translations = req.translations?.filter((t) => t.locale === locale) ?? []
                const purpose = translations.find((t) => t.field === "purpose")?.value ?? req.purpose
                const technicalConstraints = translations.find((t) => t.field === "technicalConstraints")?.value ?? req.technicalConstraints
                const promptText = translations.find((t) => t.field === "promptText")?.value ?? req.promptText
                return `### Criterion ${index + 1} (id: "${req.id}", score: ${req.score})\nPurpose: ${purpose}\nConstraints: ${technicalConstraints}\nGrading Prompt: ${promptText}`
            })
            .join("\n\n")

        const systemText = [
            `You are a senior educator reviewing a learner's submitted document for challenge: "${challengeTitle}".`,
            "Review the document against EACH pass criterion below.",
            "For EACH criterion, determine if the document meets the requirement (passed = true/false) and provide brief feedback.",
            "If not passed, include a section or paragraph location and suggestion for fix.",
            "",
            "### Pass Criteria",
            criteriaPromptSections || "(no criteria provided)",
            "",
            "Shape:",
            "Your output JSON must exactly match the structure and keys of the following template (replace values as needed):",
            "",
            JSON.stringify(template),
            "",
            "Rules:",
            "- requirementResults must have exactly one entry per criterion, in order.",
            "- requirementId must match the criterion id provided above.",
            "- passed: true if the document meets the criterion, false otherwise.",
            "- feedback: 1-2 sentences explaining why it passed or failed.",
            "- location: section or paragraph reference where the issue is, or null if passed.",
            "- suggestion: instruction to fix the issue, or null if passed.",
            "- Focus on content completeness and accuracy.",
            "- Output must be STRICT JSON (double quotes only).",
            "- do not include trailing commas.",
            "- do not include unescaped newlines inside strings; use \\n if needed.",
            "- if you include double quotes inside strings, they must be escaped as \\\".",
        ].join("\n")

        const humanText = [
            "Below is the content loaded from the submitted document (may be truncated):",
            "",
            sourceExcerpt || "(empty document content)",
        ].join("\n")

        const gradeModelChoice = this.gradeModelRouterService.current

        const model = this.modelService.get({
            model: context.payload.gradingModel ?? gradeModelChoice.model,
            provider: (context.payload.gradingProvider ?? gradeModelChoice.provider) as ModelProvider,
        })

        const response = await model.invoke([
            new SystemMessage(systemText),
            new HumanMessage(humanText),
        ])

        const raw = (typeof response.content === "string" ? response.content : String(response.content)) as string

        const requirementResults = this.parseGradeFromModelText(raw)

        requirementResults.map((cr) => {
            const matchingCriteria = requirements.find((c) => c.id === cr.requirementId)
            const score = cr.passed && matchingCriteria ? matchingCriteria.score : 0
            return {
                ...cr,
                score,
            }
        })
        const totalScore = requirementResults.reduce((sum, cr) => sum + cr.score,
            0)
        const maxScore = requirements.reduce((sum, req) => sum + req.score,
            0)
        const passedRequirements = requirementResults.filter((cr) => cr.passed).length
        const failedRequirements = requirementResults.filter((cr) => !cr.passed).length

        return {
            totalScore,
            maxScore,
            passedRequirements,
            failedRequirements,
            requirementResults,
        }
    }

    private async finalize(
        executionResult: ProcessGoogleDocsSubmissionGradeStepExecuteResult,
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
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

        await this.eventEmitterService.emit({
            event: EventName.ChallengeSubmissionProgressUpdated,
            payload: {
                enrollmentId: payload.enrollmentId,
                courseId: payload.courseId,
            },
        })
    }

    /**
     * Parses the grade from the model text.
     */
    private parseGradeFromModelText(
        text: string,
    ): Array<ProcessGoogleDocsSubmissionGradeStepRequirementResult> {
        const brace = text.match(/\{[\s\S]*?\}/)

        if (!brace) {
            throw new ParsingScoreFromModelTextException({
                text 
            })
        }

        try {
            const parsed = JSON.parse(brace[0]) as unknown

            if (
                typeof parsed !== "object" ||
                parsed === null ||
                !("requirementResults" in parsed) ||
                !Array.isArray((parsed as Record<string, unknown>).requirementResults)
            ) {
                throw new Error("Missing requirementResults array")
            }
            const rawResults = parsed.requirementResults as Array<unknown>
            return rawResults.map(
                (cr: unknown) => {
                    if (typeof cr !== "object" || cr === null) {
                        throw new Error("Invalid requirement result object")
                    }
                    const record = cr as Record<string, unknown>
                    return {
                        requirementId: String(record.requirementId),
                        passed: Boolean(record.passed),
                        feedback: String(record.feedback || ""),
                        location: typeof record.location === "string" ? record.location : null,
                        suggestion: typeof record.suggestion === "string" ? record.suggestion : null,
                        score: Number(record.score) || 0,
                    }
                },
            )
        } catch {
            throw new ParsingScoreFromModelTextException({
                text 
            })
        }
    }
}
