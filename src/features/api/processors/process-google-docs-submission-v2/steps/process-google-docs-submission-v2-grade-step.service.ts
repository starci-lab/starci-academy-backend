import type {
    ProcessGoogleDocsSubmissionPayload,
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
import template from "../../process-google-docs-submission/steps/template.json"
import {
    AiInvokeService,
    AiEntitlementService,
    pickBestCategory,
} from "@modules/ai"
import type {
    AiInvokeByok,
} from "@modules/ai"
import {
    GoogleDriverAPIService,
} from "@modules/googleapis"
import {
    ProcessGoogleDocsSubmissionParseService,
} from "../../process-google-docs-submission/steps/parse.service"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
} from "../../process-google-docs-submission/types"
import {
    collectSubmissionCriteria,
    renderCriteriaPromptSections,
} from "../../process-git-submission-v2/steps/criteria.util"

/**
 * SCHEMA V2 grade step (stepIndex 0) for Google Docs submissions. Mirrors the legacy gdocs grade
 * step but grades the document against the challenge's outcome + approach (per-language) yes/no
 * criteria. Outputs the same evaluation template shape so the legacy complete step + parse service
 * can be reused. Uses the same `stepName` ("grade") as V1.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionV2GradeStepService extends AbstractStepService<
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
        private readonly creditUsageService: CreditUsageService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "grade"

    /**
     * Process the grade step.
     */
    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(context)
            await this.finalize(executionResult,
                context)
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
     * Execute the grade step: fetch doc text → similarity search on criteria → LLM grades each criterion.
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
        // outcome + approach criteria of the SPECIFIC submission being graded, resolved to the
        // learner's chosen programming language (per-submission, per-language — not challenge-level)
        const criteria = collectSubmissionCriteria(
            context.extended?.challengeSubmission,
            payload.lang,
        )
        const url = context.extended?.userChallengeSubmission.submissionUrl ?? ""

        /** Fetch Google Docs text */
        const {
            text: docText,
        } = await this.googleDriverApiService.fetchGoogleDocsText(
            {
                urlOrId: url,
            },
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
                },
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
        const criteriaQueryText = criteria
            .map((criterion) => criterion.body)
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
            sourceExcerpt = sourceExcerpt.slice(0,
                maxChars)
        }
        /** Build criteria prompt sections */
        const criteriaPromptSections = renderCriteriaPromptSections(criteria)
        const maxScore = criteria.reduce((sum, criterion) => sum + criterion.score,
            0)

        const systemText = [
            `You are a strict, experienced reviewer grading a learner's submitted document for the challenge: "${challengeTitle}".`,
            "",
            "## Task",
            "Grade the submitted document against EVERY yes/no criterion listed below.",
            "Each criterion is binary: it is either MET (award its full score) or NOT MET (award 0).",
            "Do NOT award partial credit for a single criterion.",
            "",
            "## Critical criteria",
            "Some criteria are marked **CRITICAL**. If ANY critical criterion is NOT MET, the TOTAL score is 0 for the whole submission, regardless of the other criteria.",
            "",
            "## IMPORTANT: Language Requirement",
            `All feedback text MUST be written in **${targetLanguage}**.`,
            `JSON keys must remain in English, but all human-readable values (shortFeedback, message, suggestion) must be in ${targetLanguage}.`,
            "",
            "## Criteria",
            criteriaPromptSections || "(no criteria provided)",
            "",
            `## Scoring (max total: ${maxScore})`,
            "- total score = sum of the scores of every MET criterion.",
            "- If any CRITICAL criterion is NOT MET, set the total score to 0.",
            "",
            "## Output Format",
            "Respond with a single JSON object matching this template exactly (replace placeholder values):",
            "",
            JSON.stringify(template,
                null,
                2),
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- Escape newlines as \\\\n and double quotes as \\\\\" inside string values.",
            "",
            "## Grading Philosophy",
            "- Focus on content completeness and accuracy, NOT formatting or style.",
            "- For each criterion, add a feedback item stating whether it was met and the evidence.",
            "- Be skeptical: if the evidence for a criterion is not clearly present in the document, treat it as NOT MET.",
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
        /** Block grading once the user is over their credit quota. */
        const creditSnapshot = await this.creditUsageService.getSnapshot(enrollment.userId)
        if (creditSnapshot.overQuota) {
            throw new AiQuotaExhaustedException({
                mode: payload.mode ?? AiMode.Auto,
                window: "credit",
            })
        }
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
        const passed = parsed.score >= maxScore * passThreshold
        return {
            evaluation: parsed,
            passed,
        }
    }

    /**
     * Resolve the submitter's entitlement and derive the args to pass to
     * {@link AiInvokeService.invoke} (once per grading job).
     * @param params - The resolved `userId` and the job payload.
     * @returns Partial `invoke` args (`byok` OR `category`).
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
        return {
            category,
        }
    }

    /**
     * Finalize the grade step: persist the execution result for the complete step.
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
