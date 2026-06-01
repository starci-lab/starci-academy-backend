import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/bullmq"
import type {
    ReviewMilestoneTaskGradeResult,
} from "../types"
import {
    JobActionService,
    CreditUsageService,
} from "@modules/bussiness"
import {
    AbstractStepService,
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
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    MilestoneTaskEntity,
    InjectQdrantClient,
    ModelProvider,
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
    DayjsService,
} from "@modules/mixin"
import {
    EmbeddingModelService,
} from "@modules/langchain"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
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
import {
    Document,
} from "@langchain/core/documents"
import {
    AiInvokeService,
    AiEntitlementService,
    resolveGradingInvokeOptions,
} from "@modules/ai"
import {
    ProjectEvaluationParseService,
} from "../../shared/project-evaluation"

/**
 * Step 0: Load GitHub repo → LLM grades per criterion (yes/no + score) → persist attempt + feedback.
 * Also ensures the UserMilestoneTask record exists for the given enrollment + milestoneTask.
 */
@Injectable()
export class ReviewMilestoneTaskGradeStepService extends AbstractStepService<
    ReviewPersonalProjectTaskPayload,
    EmptyObject
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
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly dayjsService: DayjsService,
        private readonly projectEvaluationParseService: ProjectEvaluationParseService,
        private readonly creditUsageService: CreditUsageService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "review-milestone-task-grade"

    /** Process the step. */
    async process(
        context: JobExtendedContext<ReviewPersonalProjectTaskPayload, EmptyObject>,
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
     * Execute the step.
     * @param context - Context of the step.
     * @returns A promise that resolves when the step is executed.
     */
    private async execute(
        context: JobExtendedContext<ReviewPersonalProjectTaskPayload, EmptyObject>,
    ): Promise<ReviewMilestoneTaskGradeResult> {
        const { payload } = context
        const branch = payload.branch ?? "main"

        /** Map locale code to full language name for the LLM prompt. */
        const locale = payload.locale ?? Locale.En
        const localeLanguageMap: Record<string, string> = {
            en: "English",
            vi: "Vietnamese (Tiếng Việt)",
        }
        const targetLanguage = localeLanguageMap[locale] ?? "English"

        /** Load the milestone task with its criteria */
        const milestoneTask = await this.entityManager.findOneOrFail(
            MilestoneTaskEntity,
            {
                where: {
                    id: payload.taskId
                },
                relations: {
                    criterias: {
                        translations: true,
                    },
                },
            },
        )
        const criteria = milestoneTask.criterias ?? []

        /** Load GitHub repo */
        const repoUrl = payload.githubUrl
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
                    ".git",
                ],
            },
        )
        let loadedDocs: Array<Document>
        try {
            loadedDocs = await gitLoader.load()
        } catch (error) {
            const msg = error?.message ?? ""
            if (msg.includes("404")) {
                throw new Error(
                    `Repository not found: "${repoUrl}" (branch: "${branch}"). Please check that the repository exists, is public (or your GitHub token has access), and the branch name is correct.`
                )
            }
            if (msg.includes("403")) {
                throw new Error(
                    `Access denied to repository: "${repoUrl}". The GitHub token may lack permission or the rate limit has been exceeded.`
                )
            }
            throw new Error(
                `Failed to load repository "${repoUrl}" (branch: "${branch}"): ${msg}`
            )
        }
        if (loadedDocs.length === 0) {
            throw new Error(
                `Repository "${repoUrl}" (branch: "${branch}") is empty or contains no reviewable files.`
            )
        }
        const docs = loadedDocs.map(
            (doc) =>
                new Document({
                    pageContent: doc.pageContent,
                    metadata: doc.metadata,
                    id: doc.id,
                }),
        )

        /** Split */
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.githubWorker.processGitSubmission.chunkSize,
            chunkOverlap: envConfig().services.githubWorker.processGitSubmission.chunkOverlap,
        })
        const chunks = await splitter.splitDocuments(docs)

        /** Vectorize into Qdrant. */
        const collectionName = `review-milestone-task-${payload.enrollmentId}-${payload.taskId}`
        const embeddingModel = this.embeddingModelService.get(
            {
                model: envConfig().services.githubWorker.processGitSubmission.embedding.model,
                provider: envConfig().services.githubWorker.processGitSubmission.embedding.provider as ModelProvider,
            },
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
        const vectorStore = await QdrantVectorStore.fromExistingCollection(
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName,
            },
        )

        /** Build source excerpt using criteria translations for the target locale */
        const criteriaQueryText = criteria
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
            .map((criterion) => {
                const text = criterion.text
                const promptText = criterion.promptText
                return `${text}\n${promptText}`
            })
            .join("\n\n")
        const topChunks = await vectorStore.similaritySearch(
            criteriaQueryText,
            20,
        )
        let sourceExcerpt = (topChunks.length > 0 ? topChunks : chunks)
            .map((chunk) => chunk.pageContent)
            .join("\n\n")
        const maxChars = envConfig().services.githubWorker.processGitSubmission.gradingMaxSourceChars
        if (sourceExcerpt.length > maxChars) {
            sourceExcerpt = sourceExcerpt.slice(
                0,
                maxChars
            )
        }
        /** Build criteria prompt */
        const criteriaPromptSections = criteria
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
            .map(
                (criterion, index) => {
                    const text = criterion.text
                    const promptText = criterion.promptText
                    const lines = [
                        `### Criteria ${index} (id: "${criterion.id}", maxScore: ${criterion.score})`,
                        `**Display text:** ${text}`,
                    ]
                    if (promptText) lines.push(`**Grading Rubric:**\n${promptText}`)
                    return lines.join("\n")
                },
            )
            .join("\n\n")

        const taskTitle = milestoneTask.title ?? "milestone task"
        const systemText = [
            `You are a strict, experienced code reviewer grading a learner's personal project for task: "${taskTitle}".`,
            "",
            "## Task",
            "Review the submitted source code against EVERY criteria listed below.",
            "For each criteria, evaluate whether the code satisfies it, provide concise feedback, and assign a score based on the rubric.",
            "",
            "## IMPORTANT: Language Requirement",
            `All feedback text MUST be written in **${targetLanguage}**.`,
            `JSON keys must remain in English, but all human-readable values (shortFeedback, feedback, suggestion) must be in ${targetLanguage}.`,
            "",
            "## Criteria",
            criteriaPromptSections || "(no criteria provided)",
            "",
            "## Output Format",
            "Respond with a single JSON object matching this template exactly (replace placeholder values):",
            "",
            JSON.stringify(
                template,
                null,
                2
            ),
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- Escape newlines as \\\\n and double quotes as \\\\\" inside string values.",
            "",
            "## Grading Philosophy",
            "- Focus on implementation correctness and completeness, NOT code style or formatting.",
            "- If a criteria has forbidden patterns, actively search the code for violations.",
            "- A criteria can have multiple feedback items (one per sub-rubric if the grading rubric lists multiple items).",
            "- Criteria with maxScore: 0 still need feedback but contribute 0 to the total.",
        ].filter(Boolean).join("\n")

        const humanText = [
            "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
            "",
            sourceExcerpt || "(empty repository excerpt)",
        ].join("\n")

        /** Resolve + debit the submitter's AI quota once for this grading job. */
        const enrollment = await this.entityManager.findOneOrFail(
            EnrollmentEntity,
            {
                where: {
                    id: payload.enrollmentId,
                },
            },
        )
        /** Auto lane → gate on the shared 50-credit pool; Premium/Byok are not billed for task review yet. */
        if ((payload.ai?.mode ?? AiMode.Auto) === AiMode.Auto) {
            const creditSnapshot = await this.creditUsageService.getSnapshot(enrollment.userId)
            if (creditSnapshot.overQuota) {
                throw new AiQuotaExhaustedException({
                    mode: AiMode.Auto,
                    window: "credit",
                })
            }
        }
        const invokeOptions = await resolveGradingInvokeOptions(
            {
                userId: enrollment.userId,
                selection: payload.ai,
                aiEntitlementService: this.aiEntitlementService,
            },
        )

        const { text: raw, model, provider, attempts } = await this.aiInvokeService.invoke(
            {
                messages: [
                    new SystemMessage(systemText),
                    new HumanMessage(humanText),
                ],
                ...invokeOptions,
            },
        )

        const parsed = this.projectEvaluationParseService.parse(raw)
        const passThreshold = this.mountStorageService.appConfig.systemConfig.task.passThreshold
        const passed = parsed.score >= milestoneTask.maxScore * passThreshold
        return {
            evaluation: parsed,
            passed,
            aiUsage: {
                model,
                provider,
                attempts,
            },
        }
    }

    /** Finalize the step. */
    private async finalize(
        executionResult: ReviewMilestoneTaskGradeResult,
        context: JobExtendedContext<ReviewPersonalProjectTaskPayload, EmptyObject>,
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


