import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
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
    AiMode,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
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
    ModelRecommendation,
    resolveGradingCreditCost,
    resolveGradingInvokeOptions,
} from "@modules/ai"
import {
    ChallengeEvaluationParseService,
} from "../../shared/challenge-evaluation"
import type {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionGradeStepExecuteResult,
} from "../types"

/**
 * Step 0: Load GitHub repo → LLM grades per requirement → evaluation + passed.
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
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly challengeEvaluationParseService: ChallengeEvaluationParseService,
        private readonly creditUsageService: CreditUsageService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "grade"

    /**
     * Process the grade step
     */
    async process(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >,
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
                },
            )
            throw error
        }
    }

    /**
     * Execute the grade step
     */
    private async execute(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<ProcessGitSubmissionGradeStepExecuteResult> {
        const { payload } = context
        const branch = payload.branch ?? "main"

        const locale = payload.locale ?? Locale.En
        const localeLanguageMap: Record<string, string> = {
            en: "English",
            vi: "Vietnamese (Tiếng Việt)",
        }
        const targetLanguage = localeLanguageMap[locale] ?? "English"

        const challenge = context.extended?.challenge
        const challengeTitle = (challenge?.title ?? "").trim()
        const requirements = challenge?.requirements ?? []
        const repoUrl = context.extended?.userChallengeSubmission.submissionUrl ?? ""
        /** Load GitHub repo */
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
        const loadedDocs = await gitLoader.load()
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

        /** Vectorize into Qdrant */
        const collectionName = `grading-${payload.userChallengeSubmissionId}`
        const embeddingModel = this.embeddingModelService.get(
            {
                model: payload.embeddingModel ?? envConfig().services.githubWorker.processGitSubmission.embedding.model,
                provider: payload.embeddingProvider ?? envConfig().services.githubWorker.processGitSubmission.embedding.provider as ModelProvider,
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
        /** Build criteria query text for similarity search */
        const criteriaQueryText = requirements
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
            .map((requirement) => {
                const purpose = requirement.purpose
                const promptText = requirement.promptText
                return `${purpose}\n${promptText}`
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
        const criteriaPromptSections = requirements
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
            .map(
                (requirement, index) => {
                    const lines = [
                        `### Requirement ${index} (id: "${requirement.id}", maxScore: ${requirement.score})`,
                        `**Purpose:** ${requirement.purpose}`,
                        `**Constraints:** ${requirement.technicalConstraints}`,
                    ]
                    if (requirement.promptText) lines.push(`**Grading Rubric:**\n${requirement.promptText}`)
                    if (requirement.forbidden) lines.push(`**Forbidden (auto-fail if violated):**\n${requirement.forbidden}`)
                    if (requirement.proTipsHints) lines.push(`**Hints:** ${requirement.proTipsHints}`)
                    return lines.join("\n")
                },
            )
            .join("\n\n")

        const systemText = [
            `You are a strict, experienced code reviewer grading a learner's submission for the challenge: "${challengeTitle}".`,
            "",
            "## Task",
            "Review the submitted source code against EVERY requirement listed below.",
            "For each requirement, evaluate whether the code satisfies it, provide concise feedback, and assign a score based on the rubric.",
            "",
            "## IMPORTANT: Language Requirement",
            `All feedback text MUST be written in **${targetLanguage}**.`,
            `JSON keys must remain in English, but all human-readable values (shortFeedback, message, suggestion) must be in ${targetLanguage}.`,
            "",
            "## Requirements",
            criteriaPromptSections || "(no requirements provided)",
            "",
            "## Output Format",
            "Respond with a single JSON object matching this template exactly (replace placeholder values):",
            "",
            JSON.stringify(
                template,
                null,
                2,
            ),
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- Escape newlines as \\\\n and double quotes as \\\\\" inside string values.",
            "",
            "## Grading Philosophy",
            "- Focus on implementation correctness and completeness, NOT code style or formatting.",
            "- If a requirement has forbidden patterns, actively search the source for violations.",
            "- A requirement can have multiple feedback items (one per sub-rubric if the grading rubric lists multiple items).",
            "- Requirements with maxScore: 0 still need feedback but contribute 0 to the total.",
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
        /** Gate the grading run by lane: Auto → shared 50-credit pool; Premium → tier pool; Byok → none. */
        const aiMode = payload.ai?.mode ?? AiMode.Auto
        if (aiMode === AiMode.Auto) {
            // free Auto lane → block when over the shared 50-credit rolling pool
            const creditSnapshot = await this.creditUsageService.getSnapshot(enrollment.userId)
            if (creditSnapshot.overQuota) {
                throw new AiQuotaExhaustedException({
                    mode: AiMode.Auto,
                    window: "credit",
                })
            }
        } else if (aiMode === AiMode.Premium) {
            // Premium lane → block when the tier credit pool lacks headroom for this grading's cost
            const recommendation = envConfig().ai.modelRecommendation as ModelRecommendation
            const cost = resolveGradingCreditCost({
                mode: AiMode.Premium,
                recommendation,
            })
            const entitlement = await this.aiEntitlementService.resolve({
                userId: enrollment.userId,
                requestedMode: AiMode.Premium,
            })
            if (
                entitlement.creditRemaining5h < cost
                || entitlement.creditRemainingWeek < cost
            ) {
                throw new AiQuotaExhaustedException({
                    mode: AiMode.Premium,
                    window: "credit",
                })
            }
        }
        // Byok → user's own key, no quota gate
        const invokeOptions = await resolveGradingInvokeOptions(
            {
                userId: enrollment.userId,
                selection: payload.ai,
                aiEntitlementService: this.aiEntitlementService,
            },
        )

        const { text: raw, model, provider, attempts } = await this.aiInvokeService.invoke({
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
            ...invokeOptions,
        })

        const parsed = this.challengeEvaluationParseService.parse(raw)
        const passThreshold = this.mountStorageService.appConfig.systemConfig.challenge.passThreshold
        const maxScore = requirements.reduce(
            (sum, requirement) => sum + requirement.score,
            0,
        )
        const passed = parsed.score >= maxScore * passThreshold
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

    /**
     * Finalize the grade step
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
}

