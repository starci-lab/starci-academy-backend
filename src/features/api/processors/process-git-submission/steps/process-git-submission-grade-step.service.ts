import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    InjectQdrantClient,
    Locale,
    ModelProvider,
} from "@modules/databases"
import {
    GradeModelRouterService,
} from "@modules/ai"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
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
import type {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionGradeStepRequirementResult,
    ProcessGitSubmissionGradeStepExecuteResult,
} from "../types"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    Document,
} from "@langchain/core/documents"
import {
    envConfig,
} from "@modules/env"
import {
    EmbeddingModelService,
    ModelService,
} from "@modules/langchain"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    ParsingScoreFromModelTextException,
} from "@modules/exceptions"
import {
    GithubRepoLoader,
} from "@langchain/community/document_loaders/web/github"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import {
    MountStorageService,
} from "@modules/filesystem"
import template from "./template.json"

/**
 * Load repo docs → split → vectorize → grade the submission.
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
        private readonly mountStorageService: MountStorageService,
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
        const branch = context.payload.branch ?? "main"
        const repoUrl = context.extended?.userChallengeSubmission.submissionUrl ?? ""

        const gitLoader = new GithubRepoLoader(
            repoUrl,
            {
                branch,
                recursive: true,
                accessToken: this.mountStorageService.githubAccessToken,
                verbose: true,
                ignorePaths: [
                    "package-lock.json",
                    "dist",
                    "node_modules",
                ],
            },
        )

        const loadedDocs = await gitLoader.load()

        const docs = loadedDocs.map(
            (doc) =>
                new Document({
                    pageContent: doc.pageContent,
                    metadata: doc.metadata,
                    id: doc.id,
                }),
        )

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.githubWorker.processGitSubmission.chunkSize,
            chunkOverlap: envConfig().services.githubWorker.processGitSubmission.chunkOverlap,
        })
        const chunks = await splitter.splitDocuments(docs)

        const collectionName = `grading-${context.payload.userChallengeSubmissionId}`
        const embeddingModel = this.embeddingModelService.get(
            {
                model: context.payload.embeddingModel ?? envConfig().services.githubWorker.processGitSubmission.embedding.model,
                provider: (context.payload.embeddingProvider ?? envConfig().services.githubWorker.processGitSubmission.embedding.provider) as ModelProvider,
            }
        )

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

        const maxChars =
            envConfig().services.githubWorker.processGitSubmission
                .gradingMaxSourceChars

        if (sourceExcerpt.length > maxChars) {
            sourceExcerpt = sourceExcerpt.slice(
                0,
                maxChars,
            )
        }

        const locale = context.payload.locale ?? Locale.En
        const challenge = context.extended?.challenge
        const challengeTitle = (challenge?.title ?? "").trim()
        const requirements = challenge?.requirements ?? []
        const outputs = challenge?.outputs ?? []

        const outputContext = outputs
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
            .map((output, index) => {
                const translations = output.translations?.filter((t) => t.locale === locale) ?? []
                const text = translations.find((t) => t.field === "text")?.value ?? output.text
                return `- Output ${index + 1}: ${text}`
            })
            .join("\n")

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
            `You are a senior engineer reviewing and grading a learner's personal project for challenge: "${challengeTitle}".`,
            "Review the code against EACH pass criterion below.",
            "For EACH criterion, determine if the code meets the requirement (passed = true/false) and provide brief feedback.",
            "If not passed, include location (file:line) and suggestion for fix.",
            "",
            "### Expected Outputs (For Context)",
            outputContext || "(no explicit outputs provided)",
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
            "- passed: true if the code meets the criterion, false otherwise.",
            "- feedback: 1-2 sentences explaining why it passed or failed.",
            "- location: file path and line number hint where the issue is, or null if passed.",
            "- suggestion: code snippet or instruction to fix the issue, or null if passed.",
            "- Focus on implementation completeness, NOT code style.",
            "- Output must be STRICT JSON (double quotes only).",
            "- do not include trailing commas.",
            "- do not include unescaped newlines inside strings; use \\n if needed.",
            "- if you include double quotes inside strings, they must be escaped as \\\".",
        ].filter(Boolean).join("\n")

        const humanText = [
            "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
            "",
            sourceExcerpt || "(empty repository excerpt)",
        ].join("\n")


        const gradeModelChoice = this.gradeModelRouterService.current

        const model = this.modelService.get({
            model:
                context.payload.gradingModel ??
                gradeModelChoice.model,
            provider:
                (context.payload.gradingProvider ??
                    gradeModelChoice.provider) as ModelProvider,
        })

        const response = await model.invoke(
            [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
        )

        const raw = (typeof response.content === "string"
            ? response.content
            : String(response.content)) as string
        const parsed = this.parseGradeFromModelText(raw)

        const requirementResults = parsed.map((requirementResult) => {
            const matchingRequirement = requirements.find((requirement) => requirement.id === requirementResult.requirementId)
            const score = requirementResult.passed && matchingRequirement ? matchingRequirement.score : 0
            return {
                ...requirementResult,
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

    /**
     * Finalize the step.
     * @param executionResult - The execution result.
     * @param context - The context.
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
        await this.eventEmitterService.emit({
            event: EventName.ChallengeSubmissionProgressUpdated,
            payload: {
                enrollmentId: payload.enrollmentId,
                courseId: payload.courseId,
            },
        })
    }

    /**
     * Parse the grade from the model text.
     * @param text - The text to parse the grade from.
     * @returns The parsed grade result.
     */
    private parseGradeFromModelText(
        text: string,
    ): Array<ProcessGitSubmissionGradeStepRequirementResult> {
        const first = text.indexOf("{")
        const last = text.lastIndexOf("}")
        if (first === -1 || last === -1 || last <= first) {
            throw new ParsingScoreFromModelTextException({
                text 
            })
        }

        try {
            const jsonText = text.slice(first,
                last + 1)
            const parsed = JSON.parse(jsonText) as unknown

            if (
                typeof parsed !== "object" ||
                parsed === null ||
                !("requirementResults" in parsed) ||
                !Array.isArray((parsed as Record<string, unknown>).requirementResults)
            ) {
                throw new Error("Missing requirementResults array")
            }

            const rawResults = (parsed as { requirementResults: unknown[] }).requirementResults

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
