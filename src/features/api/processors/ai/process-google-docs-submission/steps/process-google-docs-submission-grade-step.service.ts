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
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
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
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    Document,
} from "@langchain/core/documents"
import {
    MountStorageService,
} from "@modules/filesystem"
import template from "./template.json"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
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
} from "@modules/rag"

@Injectable()
/**
 * SCHEMA V2 grade step (stepIndex 0) for Google Docs submissions. Mirrors the legacy gdocs grade
 * step but grades the document against the challenge's outcome + approach (per-language) yes/no
 * criteria. Outputs the same evaluation template shape so the legacy complete step + parse service
 * can be reused. Uses the same `stepName` ("grade") as V1.
 */
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
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly googleDriverApiService: GoogleDriverAPIService,
        private readonly challengeEvaluationParseService: ChallengeEvaluationParseService,
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
     * Execute the grade step: fetch doc text -> similarity search on criteria -> LLM grades each criterion.
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
        // learner's chosen programming language (per-submission, per-language -- not challenge-level)
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

        /** ONE high-level RAG call owns chunk -> embed -> retrieve; the worker only gathers
            the source text + criteria. The run namespace (submission + fencing token) isolates
            a stalled re-dispatch from corrupting the live owner's vectors mid-search. */
        const gradingCfg = envConfig().services.githubWorker.processGitSubmission
        const { excerpt: sourceExcerpt } = await this.gradingRetrievalService.retrieveGradingExcerpt(
            {
                runKey: `${payload.userChallengeSubmissionId}-${context.job.fencingToken}`,
                documents: [
                    new Document({
                        pageContent: docText,
                        metadata: {
                            source: url,
                        },
                    }),
                ],
                criteria,
                chunkSize: gradingCfg.chunkSize,
                chunkOverlap: gradingCfg.chunkOverlap,
                embedding: {
                    model: payload.embeddingModel ?? gradingCfg.embedding.model,
                    provider: payload.embeddingProvider ?? (gradingCfg.embedding.provider as ModelProvider),
                },
                maxChars: gradingCfg.gradingMaxSourceChars,
                perCriterionTopK: gradingCfg.gradingPerCriterionTopK,
                jobId: context.job.id ?? "",
            },
        )
        /** Build criteria prompt sections */
        const criteriaPromptSections = renderCriteriaPromptSections(criteria)
        const maxScore = criteria.reduce((sum, criterion) => sum + criterion.score,
            0)

        // CACHE INVARIANT -- do NOT interpolate anything submission-specific here.
        // The provider caches this prompt by its exact prefix and re-prices repeat
        // reads at a fraction (see creditForRun's cachedTokens path). Every value
        // below is challenge-level (title, maxScore, language), so all submissions
        // of one challenge share the cached prefix. Splicing in the learner's name,
        // an id, or a timestamp would make every call a unique prefix and kill the
        // discount silently -- no error, just a bigger bill. Submission content
        // belongs in the HumanMessage, which follows this.
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
        // block on the unified credit pool before spending on the grading run
        await this.aiEntitlementService.assertNotOverQuota({
            userId: enrollment.userId,
        })
        // ONE shared entry: TEXT grading (googleDocs submission = design-doc / write-up)
        // floors at Economy -- eval showed Economy models grade text/reading tasks
        // correctly (right score ordering, no length bias). Only CODE grading
        // (githubUrl + capstone) needs the higher Balanced floor. Climbs to ceiling.
        const {
            text: raw, model, provider, attempts, cost, promptTokens, completionTokens, cachedTokens,
        } = await this.aiInvokeService.run({
            userId: enrollment.userId,
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
            selection: payload.ai,
            floor: AiModelCategory.Low,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.ChallengeGrading,
            cacheSessionId: challenge?.id,
        })

        // Charge for the LLM usage NOW (idempotently), BEFORE parsing -- a parse failure must not
        // leak free usage. The `creditCharged` marker keeps a stalled re-run from double-charging,
        // and the complete step skips its own debit when this marker is present.
        const alreadyCharged = await this.jobActionService.loadExecutionResult<boolean>({
            job: context.job,
            key: "creditCharged",
        })
        if (!alreadyCharged) {
            await this.aiEntitlementService.consume({
                userId: enrollment.userId,
                // charge by the model that actually served (from run)
                cost,
                surface: AiCeilSurface.Grading,
                task: AiModelTask.ChallengeGrading,
                model,
                provider,
                recommendation: null,
                promptTokens,
                completionTokens,
                attempts,
            })
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
                promptTokens,
                completionTokens,
                cachedTokens,
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
