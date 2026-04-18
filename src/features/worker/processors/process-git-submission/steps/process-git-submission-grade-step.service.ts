import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    InjectQdrantClient,
    ModelProvider,
    SubmissionFeedbackSeverity,
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
} from "@modules/bullmq"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionGradeStepExecuteResult,
    ProcessGitSubmissionGradeStepSubmissionFeedback,
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
                    const title = prompt.title
                        ? ` (${prompt.title})`
                        : ""
                    const body = (prompt.promptText ?? "").trim()
                    return `### Extra criterion ${index + 1}${title}\n${body || "(empty)"}`
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
            `{"score": <integer from 1 to ${submissionScore}>, "shortFeedback": "<one short sentence>", "submissionFeedbacks": [{"message": "...", "detail": "...", "severity": "low|medium|high", "location": "file.ts:line", "suggestion": "..."}]}`,
            "",
            "Example output (copy the structure, replace content):",
            JSON.stringify(template),
            "Rules:",
            `- score must be a whole number from 1 (poor) to ${submissionScore} (excellent).`,
            "- shortFeedback must be a single short sentence (no lists).",
            "- submissionFeedbacks must be an array of structured feedback items aligned with the excerpt; 2 to 6 items.",
            "- each submissionFeedbacks item must include: message, severity; detail/location/suggestion are optional.",
            "- every submissionFeedbacks item must be grounded only in the submitted repository excerpt.",
            "- output must be STRICT JSON (double quotes only).",
            "- do not include trailing commas.",
            "- do not include unescaped newlines inside strings; use \\n if needed.",
            "- if you include double quotes inside strings, they must be escaped as \\\".",
            "- do not invent files, features, or behaviors not present in the excerpt.",
            "- keep submissionFeedbacks messages actionable and specific.",
        ].filter(Boolean).join("\n")
        //console.log(systemText)

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
        const first = text.indexOf("{")
        const last = text.lastIndexOf("}")
        if (
            first !== -1 &&
            last !== -1 &&
            last > first
        ) {
            try {
                const jsonText = text.slice(
                    first,
                    last + 1,
                )
                const parsed = JSON.parse(jsonText) as {
                    score?: unknown
                    shortFeedback?: unknown
                    submissionFeedbacks?: unknown
                }

                const score = this.parseScore(parsed.score)
                const shortFeedback = this.parseShortFeedback(parsed.shortFeedback)
                const submissionFeedbacks = this.parseSubmissionFeedbacks(
                    parsed.submissionFeedbacks,
                )

                return {
                    score,
                    shortFeedback,
                    submissionFeedbacks,
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
     * Parse the short feedback from the model text.
     * @param value - The value to parse the short feedback from.
     * @returns The parsed short feedback.
     */
    private parseShortFeedback(
        value: unknown,
    ): string | null {
        if (typeof value !== "string") {
            return null
        }
        const t = value.trim()
        return t ? t : null
    }

    /**
     * Parse the submission feedbacks from the model text.
     * @param value - The value to parse the submission feedbacks from.
     * @returns The parsed submission feedbacks.
     */
    private parseSubmissionFeedbacks(
        value: unknown,
    ): Array<ProcessGitSubmissionGradeStepSubmissionFeedback> {
        if (!Array.isArray(value)) {
            return []
        }
        const items = value
            .filter((v): v is Record<string, unknown> => (
                typeof v === "object" && v !== null && !Array.isArray(v)
            ))
            .map((v) => {
                const message =
                    typeof v.message === "string"
                        ? v.message.trim()
                        : ""
                if (!message) {
                    return null
                }
                const severityRaw =
                    typeof v.severity === "string"
                        ? v.severity.trim().toLowerCase()
                        : SubmissionFeedbackSeverity.Medium
                const severity: SubmissionFeedbackSeverity =
                    severityRaw === SubmissionFeedbackSeverity.Low || severityRaw === SubmissionFeedbackSeverity.High
                        ? severityRaw
                        : SubmissionFeedbackSeverity.Medium
                const detail =
                    typeof v.detail === "string"
                        ? v.detail.trim()
                        : undefined
                const location =
                    typeof v.location === "string"
                        ? v.location.trim()
                        : undefined
                const suggestion =
                    typeof v.suggestion === "string"
                        ? v.suggestion.trim()
                        : undefined
                return {
                    message,
                    severity,
                    detail: detail || undefined,
                    location: location || undefined,
                    suggestion: suggestion || undefined,
                }
            })
            .filter((x): x is NonNullable<typeof x> => x !== null)
        return items
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
