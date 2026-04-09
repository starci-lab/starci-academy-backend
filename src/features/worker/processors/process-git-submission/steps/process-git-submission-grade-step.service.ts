import type {
    ProcessGitSubmissionPayload,
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
} from "../types"
import {
    JobExtendedContext,
} from "../../types"
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
    InvalidModelGradeScoreException,
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
    ) {
        super()
    }

    stepIndex = 0

    stepName = "grade"

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

        const challenge = context.extended?.challenge
        const challengeSubmission = context.extended?.challengeSubmission
        const challengeTitle = (challenge?.title ?? "").trim()
        const requirements = (challenge?.requirements ?? "").trim()
        const submissionTitle = challengeSubmission?.title ?? ""
        const submissionDescription = (challengeSubmission?.description ?? "").trim()
        const submissionScore = challengeSubmission?.score ?? 0
        const extraPromptSections = (context.extended?.prompts ?? [])
            .map(
                (
                    prompt,
                    index,
                ) => {
                    const label = prompt.title
                        ? ` (${prompt.title})`
                        : ""
                    const body = (prompt.promptText ?? "").trim()
                    return `### Extra criterion ${index + 1}${label}\n${body || "(empty)"}`
                },
            )
            .join("\n\n")

        const systemText = [
            "You are a principal engineer reviewing and grading a learner's GitHub submission.",
            "Use the challenge requirements, submission instructions, and extra criteria below to assign the score and feedback.",
            "",
            challengeTitle
                ? `### Challenge\n${challengeTitle}`
                : "### Challenge\n(untitled)",
            "",
            "### Challenge requirements",
            requirements || "(none provided)",
            "",
            "### This submission slot (what the learner was asked to submit)",
            submissionTitle
                ? `Title: ${submissionTitle}`
                : "(no title)",
            `\nPoints configured for this submission slot: ${submissionScore}`,
            submissionDescription
                ? `\nInstructions / description:\n${submissionDescription}`
                : "",
            "",
            "### Extra grading criteria (from the course database; each item has promptText you must apply)",
            extraPromptSections || "(none provided)",
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
        ].filter(Boolean).join("\n")

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
            ],
        )

        const raw = (typeof response.content === "string"
            ? response.content
            : String(response.content)) as string

        return this.parseGradeFromModelText(raw)
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
     * Parse the score from the model text.
     * @param value - The value to parse the score from.
     * @returns The parsed score.
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
     * Parse the feedbacks from the model text.
     * @param value - The value to parse the feedbacks from.
     * @returns The parsed feedbacks.
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
     * Clamp the score.
     * @param value - The value to clamp.
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
