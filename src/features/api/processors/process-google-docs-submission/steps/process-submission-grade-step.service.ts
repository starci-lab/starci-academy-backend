import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    AiMode,
    AiModelCategory,
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
    AiInvokeService,
    AiEntitlementService,
} from "@modules/ai"
import type {
    AiInvokeByok,
} from "@modules/ai"
import {
    GoogleDriverAPIService,
} from "@modules/googleapis"
import {
    ProcessGoogleDocsSubmissionParseService,
} from "./parse.service"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
} from "../types"

/**
 * Step 0: Fetch Google Docs text → LLM grades per requirement → evaluation + passed.
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
        private readonly mountStorageService: MountStorageService,
        private readonly embeddingModelService: EmbeddingModelService,
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly googleDriverApiService: GoogleDriverAPIService,
        private readonly processGoogleDocsSubmissionParseService: ProcessGoogleDocsSubmissionParseService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "grade"

    /**
     * Process the step.
     * @param context - Context of the step.
     * @returns A promise that resolves when the step is processed.
     */
    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
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
     * Execute the step.
     * @param context - Context of the step.
     * @returns A promise that resolves when the step is executed.
     */
    private async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<ProcessGoogleDocsSubmissionGradeStepExecuteResult> {
        const { payload } = context

        const locale = payload.locale ?? Locale.En
        const localeLanguageMap: Record<string, string> = {
            en: "English",
            vi: "Vietnamese (Tiếng Việt)",
        }
        const targetLanguage = localeLanguageMap[locale] ?? "English"

        const challenge = context.extended?.challenge
        const challengeTitle = (challenge?.title ?? "").trim()
        const requirements = challenge?.requirements ?? []
        const url = context.extended?.userChallengeSubmission.submissionUrl ?? ""

        /** Fetch Google Docs text */
        const {
            text: docText,
        } = await this.googleDriverApiService.fetchGoogleDocsText(
            {
                urlOrId: url,
            }
        )

        /** Split */
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.githubWorker.processGitSubmission.chunkSize,
            chunkOverlap: envConfig().services.githubWorker.processGitSubmission.chunkOverlap,
        })
        const docs = await splitter.createDocuments(
            [docText],
            [
                {
                    source: url,
                }
            ],
        )
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
            `You are a strict, experienced reviewer grading a learner's submitted document for the challenge: "${challengeTitle}".`,
            "",
            "## Task",
            "Review the submitted document content against EVERY requirement listed below.",
            "For each requirement, evaluate whether the document satisfies it, provide concise feedback, and assign a score based on the rubric.",
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
            "- Focus on content completeness and accuracy, NOT formatting or style.",
            "- If a requirement has forbidden patterns, actively search the document for violations.",
            "- A requirement can have multiple feedback items (one per sub-rubric if the grading rubric lists multiple items).",
            "- Requirements with maxScore: 0 still need feedback but contribute 0 to the total.",
        ].filter(Boolean).join("\n")

        const humanText = [
            "Below is the content loaded from the submitted document (may be truncated):",
            "",
            sourceExcerpt || "(empty document content)",
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
        const invokeOptions = await this.resolveInvokeOptions(
            {
                userId: enrollment.userId,
                payload,
            },
        )

        const { text: raw } = await this.aiInvokeService.invoke({
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
            ...invokeOptions,
        })

        const parsed = this.processGoogleDocsSubmissionParseService.parse(raw)
        const passThreshold = this.mountStorageService.appConfig.systemConfig.challenge.passThreshold
        const maxScore = requirements.reduce(
            (sum, requirement) => sum + requirement.score,
            0,
        )
        const passed = parsed.score >= maxScore * passThreshold
        return {
            evaluation: parsed,
            passed,
        }
    }
    
    /**
     * Resolve the submitter's entitlement and derive the args to pass to
     * {@link AiInvokeService.invoke} (once per grading job).
     *
     * - `byok`: build a BYOK descriptor from the payload (no quota debit).
     * - `auto`: debit one Economy "lượt" and grade on the Economy category.
     * - `premium`: debit + grade on the highest category the tier unlocks.
     * @param params - The resolved `userId` and the job payload.
     * @returns Partial `invoke` args (`byok` OR `category`), already debited.
     * @throws AiQuotaExhaustedException when the user has no allowance left.
     */
    private async resolveInvokeOptions(
        {
            userId,
            payload,
        }: {
            userId: string
            payload: ProcessGoogleDocsSubmissionPayload
        },
    ): Promise<{ category?: AiModelCategory, byok?: AiInvokeByok }> {
        const entitlement = await this.aiEntitlementService.resolve({
            userId,
            requestedMode: payload.mode,
        })

        if (entitlement.mode === AiMode.Byok) {
            // TODO: fall back to the stored encrypted key on the subscription
            // entity when the payload does not carry one.
            if (
                payload.byokProvider
                && payload.byokModel
                && payload.byokApiKey
            ) {
                return {
                    byok: {
                        provider: payload.byokProvider,
                        model: payload.byokModel,
                        key: payload.byokApiKey,
                    },
                }
            }
        }

        const category = entitlement.mode === AiMode.Premium
            ? pickBestCategory(entitlement.allowedCategories)
            : AiModelCategory.Economy
        await this.aiEntitlementService.consume({
            userId,
            category,
            requestedMode: payload.mode,
            // Auto lane only ever serves complimentary models; Premium is credit-based.
            complimentary: entitlement.mode === AiMode.Auto,
        })
        return {
            category,
        }
    }

    /**
     * Finalize the step.
     * @param executionResult - The execution result.
     * @param context - The context.
     * @returns A promise that resolves when the step is finalized.
     */
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

/** Rank used to pick the "best" category a Premium tier unlocks. */
const CATEGORY_RANK: Record<AiModelCategory, number> = {
    [AiModelCategory.Economy]: 0,
    [AiModelCategory.Balanced]: 1,
    [AiModelCategory.Premium]: 2,
}

/**
 * Pick the highest-ranked category from the allowed list (economy < balanced
 * < premium). Falls back to Economy when the list is empty.
 * @param categories - Categories the tier currently unlocks.
 * @returns The single best category to grade with.
 */
function pickBestCategory(
    categories: Array<AiModelCategory>,
): AiModelCategory {
    return categories.reduce(
        (best, candidate) =>
            CATEGORY_RANK[candidate] > CATEGORY_RANK[best] ? candidate : best,
        AiModelCategory.Economy,
    )
}
