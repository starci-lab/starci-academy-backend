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
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
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
    MountStorageService,
} from "@modules/filesystem"
import template from "./template.json"
import {
    AiInvokeService,
    AiEntitlementService,
    ModelRecommendation,
    resolveGradingCreditCost,
    resolveGradingInvokeOptions,
} from "@modules/ai"
import {
    GoogleDriverAPIService,
} from "@modules/googleapis"
import {
    ChallengeEvaluationParseService,
} from "../../shared/challenge-evaluation"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
} from "../types"
import {
    collectSubmissionCriteria,
    renderCriteriaPromptSections,
} from "../../shared/challenge-submission/utils"
import {
    GradingRetrievalService,
} from "../../shared/grading-retrieval"

/**
 * SCHEMA V2 grade step (stepIndex 0) for Google Docs submissions. Mirrors the legacy gdocs grade
 * step but grades the document against the challenge's outcome + approach (per-language) yes/no
 * criteria. Outputs the same evaluation template shape so the legacy complete step + parse service
 * can be reused. Uses the same `stepName` ("grade") as V1.
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
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly googleDriverApiService: GoogleDriverAPIService,
        private readonly challengeEvaluationParseService: ChallengeEvaluationParseService,
        private readonly creditUsageService: CreditUsageService,
        private readonly gradingRetrievalService: GradingRetrievalService,
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

        /** Resolve embedding model, then retrieve the most relevant content via the shared RAG service. */
        const embeddingModel = this.embeddingModelService.get(
            {
                model: payload.embeddingModel ?? envConfig().services.githubWorker.processGitSubmission.embedding.model,
                provider: payload.embeddingProvider ?? envConfig().services.githubWorker.processGitSubmission.embedding.provider as ModelProvider,
            },
        )
        const { excerpt: sourceExcerpt } = await this.gradingRetrievalService.retrieveSourceExcerpt(
            {
                // per-run namespace (submission + fencing token) isolates a stalled re-dispatch:
                // a zombie worker carries a different fencing token → a different collection
                runKey: `${payload.userChallengeSubmissionId}-${context.job.fencingToken}`,
                chunks,
                criteria,
                embeddingModel,
                maxChars: envConfig().services.githubWorker.processGitSubmission.gradingMaxSourceChars,
                perCriterionTopK: envConfig().services.githubWorker.processGitSubmission.gradingPerCriterionTopK,
                jobId: context.job.id ?? "",
            },
        )
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
            "- Before deciding, ACTUALLY READ the submitted document content, not just headings/summaries.",
            "- A criterion is MET when the document content shows it — cite the concrete evidence (section/quote).",
            "- Only mark NOT MET when, after inspecting the relevant content, the evidence is genuinely absent. Do NOT mark NOT MET merely because you skimmed headings.",
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

        // Charge for the LLM usage NOW (idempotently), BEFORE parsing — a parse failure must not
        // leak free usage. The `creditCharged` marker keeps a stalled re-run from double-charging,
        // and the complete step skips its own debit when this marker is present.
        const alreadyCharged = await this.jobActionService.loadExecutionResult<boolean>({
            job: context.job,
            key: "creditCharged",
        })
        if (!alreadyCharged) {
            const chargedMode = payload.ai?.mode ?? AiMode.Auto
            const chargeRecommendation = envConfig().ai.modelRecommendation as ModelRecommendation
            await this.aiEntitlementService.consume({
                userId: enrollment.userId,
                mode: chargedMode,
                // charge by the model that actually served (Qwen 0 / economy 5 / …)
                cost: resolveGradingCreditCost({
                    mode: chargedMode,
                    recommendation: chargeRecommendation,
                    model,
                }),
            })
            await this.creditUsageService.invalidate(enrollment.userId)
            await this.jobActionService.saveExecutionResult({
                job: context.job,
                key: "creditCharged",
                executionResult: true,
            })
        }

        const parsed = this.challengeEvaluationParseService.parse(raw)
        const passThreshold = this.mountStorageService.appConfig.systemConfig.challenge.passThreshold
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
