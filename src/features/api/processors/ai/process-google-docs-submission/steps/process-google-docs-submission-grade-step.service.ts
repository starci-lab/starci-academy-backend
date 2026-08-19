import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/process-google-docs-submission"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    Document,
} from "@langchain/core/documents"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    GoogleDriverAPIService,
} from "@modules/integrations/googleapis/google-driver-api.service"
import {
    ChallengeEvaluationParseService,
} from "../../shared/challenge-evaluation/challenge-evaluation-parse.service"
import {
    ChallengeEvaluationPromptService,
} from "../../shared/challenge-evaluation/challenge-evaluation-prompt.service"
import type {
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
} from "../types/execute"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
} from "../types/extended"
import {
    collectSubmissionCriteria,
} from "../../shared/challenge-submission/utils/collect-submission-criteria"
import {
    resolveTargetLanguage,
} from "../../shared/challenge-submission/utils/resolve-target-language"
import {
    GradingRetrievalService,
} from "@modules/integrations/rag/grading-rag-retrieval.service"
import {
    AbstractSubmissionGradeStepService,
} from "../../shared/challenge-submission/abstract-submission-grade-step.service"

@Injectable()
/**
 * SCHEMA V2 grade step (stepIndex 0) for Google Docs submissions. Mirrors the legacy gdocs grade
 * step but grades the document against the challenge's outcome + approach (per-language) yes/no
 * criteria. Outputs the same evaluation template shape so the legacy complete step + parse service
 * can be reused. Uses the same `stepName` ("grade") as V1.
 *
 * `process` + persisting the result are shared verbatim with the git-submission grade step -- see
 * {@link AbstractSubmissionGradeStepService}. This class only owns HOW the evaluation is produced:
 * fetching the submitted Google Doc and grading it at the text-grading AI floor.
 */
export class ProcessGoogleDocsSubmissionGradeStepService extends AbstractSubmissionGradeStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext,
    ProcessGoogleDocsSubmissionGradeStepExecuteResult
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
            entityManager: EntityManager,
            jobActionService: JobActionService,
            winstonService: WinstonService,
        private readonly mountStorageService: MountStorageService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly googleDriverApiService: GoogleDriverAPIService,
        private readonly challengeEvaluationParseService: ChallengeEvaluationParseService,
        private readonly challengeEvaluationPromptService: ChallengeEvaluationPromptService,
        private readonly gradingRetrievalService: GradingRetrievalService,
    ) {
        super(
            entityManager,
            jobActionService,
            winstonService,
        )
    }

    /**
     * Execute the grade step: fetch doc text -> similarity search on criteria -> LLM grades each criterion.
     */
    protected async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<ProcessGoogleDocsSubmissionGradeStepExecuteResult> {
        const { payload } = context

        const targetLanguage = resolveTargetLanguage(payload.locale)

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
        // CACHE INVARIANT: the builder keeps submission-specific source in the HumanMessage.
        const {
            messages,
            maxScore,
        } = this.challengeEvaluationPromptService.build({
            source: "document",
            challengeTitle,
            targetLanguage,
            criteria,
            sourceExcerpt,
        })

        /** Resolve + debit the submitter's AI quota once for this grading job. */
        const enrollment = await this.resolveQuotaCheckedEnrollment(
            payload.enrollmentId,
            this.aiEntitlementService,
        )
        // ONE shared entry: TEXT grading (googleDocs submission = design-doc / write-up)
        // floors at Economy -- eval showed Economy models grade text/reading tasks
        // correctly (right score ordering, no length bias). Only CODE grading
        // (githubUrl + capstone) needs the higher Balanced floor. Climbs to ceiling.
        const {
            text: raw, model, provider, attempts, cost, promptTokens, completionTokens, cachedTokens,
        } = await this.aiInvokeService.run({
            userId: enrollment.userId,
            messages,
            selection: payload.ai,
            floor: AiModelCategory.Low,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.ChallengeGrading,
            cacheSessionId: challenge?.id,
        })

        await this.chargeGradingCreditOnce({
            job: context.job,
            aiEntitlementService: this.aiEntitlementService,
            userId: enrollment.userId,
            cost,
            model,
            provider,
            promptTokens,
            completionTokens,
            attempts,
        })

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
}
