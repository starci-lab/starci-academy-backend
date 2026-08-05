import type {
    ProcessGitSubmissionPayload,
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
    GithubRepoLoader,
} from "@langchain/community/document_loaders/web/github"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    EncryptionService,
} from "@modules/crypto"
import template from "./template.json"
import {
    Document,
} from "@langchain/core/documents"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    ChallengeEvaluationParseService,
} from "../../shared/challenge-evaluation"
import type {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionGradeStepExecuteResult,
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
 * SCHEMA V2 grade step (stepIndex 0). Mirrors the legacy git grade step but grades the submitted
 * repo against the challenge's outcome + approach (per-language) yes/no criteria instead of the
 * relational requirements. Outputs the same evaluation template shape so the legacy complete step
 * and parse service can be reused. Uses the same `stepName` ("grade") as V1 so the complete step
 * reads the result transparently.
 */
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
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly challengeEvaluationParseService: ChallengeEvaluationParseService,
        private readonly gradingRetrievalService: GradingRetrievalService,
        private readonly encryptionService: EncryptionService,
    ) {
        super()
    }

    /**
     * Resolve the GitHub access token to clone the submission repo with: the learner's
     * own (decrypted) per-enrollment token when they stored one for a PRIVATE repo,
     * otherwise the org token. A token that fails to decrypt falls back to the org token
     * rather than aborting the grade. Shared with personal-project grading -- one token
     * per enrollment covers both the challenge repo and the capstone repo.
     */
    private async resolveGithubAccessToken(enrollmentId: string): Promise<string> {
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    id: enrollmentId,
                },
                select: {
                    id: true,
                    personalProjectGithubTokenEncrypted: true,
                },
            },
        )
        const encrypted = enrollment?.personalProjectGithubTokenEncrypted
        if (!encrypted) {
            return this.mountStorageService.githubAccessToken
        }
        try {
            return this.encryptionService.decrypt({
                payload: JSON.parse(encrypted),
            })
        } catch {
            return this.mountStorageService.githubAccessToken
        }
    }

    stepIndex = 0
    stepName = "grade"

    /**
     * Process the grade step.
     */
    async process(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
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
     * Execute the grade step: load repo -> similarity search on criteria -> LLM grades each criterion.
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
        // outcome + approach criteria of the SPECIFIC submission being graded, resolved to the
        // learner's chosen programming language (per-submission, per-language -- not challenge-level)
        const criteria = collectSubmissionCriteria(
            context.extended?.challengeSubmission,
            payload.lang,
        )
        const repoUrl = context.extended?.userChallengeSubmission.submissionUrl ?? ""
        // private student repos need the learner's own token (org token can't read a
        // user's private repo); falls back to the org token for public/org repos
        const accessToken = await this.resolveGithubAccessToken(payload.enrollmentId)

        /** Load GitHub repo */
        const gitLoader = new GithubRepoLoader(
            repoUrl,
            {
                branch,
                recursive: true,
                accessToken,
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
        /** ONE high-level RAG call owns chunk -> embed -> retrieve; the worker only gathers
            the source docs + criteria. The run namespace (submission + fencing token) isolates
            a stalled re-dispatch: a zombie worker carries a different fencing token -> a
            different collection, so it can never corrupt the live owner's vectors. */
        const gradingCfg = envConfig().services.githubWorker.processGitSubmission
        const { excerpt: sourceExcerpt } = await this.gradingRetrievalService.retrieveGradingExcerpt(
            {
                runKey: `${payload.userChallengeSubmissionId}-${context.job.fencingToken}`,
                documents: docs,
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
            `You are a strict, experienced code reviewer grading a learner's submission for the challenge: "${challengeTitle}".`,
            "",
            "## Task",
            "Grade the submitted source code against EVERY yes/no criterion listed below.",
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
            "- Focus on implementation correctness and evidence the criterion describes, NOT code style.",
            "- For each criterion, add a feedback item stating whether it was met and the evidence (file:line where relevant).",
            "- Before deciding, ACTUALLY READ the source files (e.g. *.ts/*.java/*.cs/*.go, module/service/controller files), not just the README/prose.",
            "- A criterion is MET when the CODE shows it — cite the concrete `file:line` evidence. Module wiring, imports, decorators and constructor signatures in the code count as evidence.",
            "- Only mark NOT MET when, after inspecting the relevant code files, the evidence is genuinely absent. Do NOT mark NOT MET merely because you skimmed the README instead of the code.",
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
        // block on the unified credit pool before spending on the grading run
        await this.aiEntitlementService.assertNotOverQuota({
            userId: enrollment.userId,
        })
        // ONE shared entry: CODE grading (githubUrl submission) floors at Balanced
        // -- NOT by difficulty. Eval evidence: Free/Economy models grade code too
        // shallowly (miss subtle API-contract defects); text grading (googleDocs /
        // interview) stays at Economy. Climbs to the tier ceiling -> served + cost.
        const {
            text: raw, model, provider, attempts, cost, promptTokens, completionTokens, cachedTokens,
        } = await this.aiInvokeService.run({
            userId: enrollment.userId,
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
            selection: payload.ai,
            floor: AiModelCategory.Medium,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.ChallengeGrading,
            // all submissions of one challenge share the rubric prefix -> one route
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
