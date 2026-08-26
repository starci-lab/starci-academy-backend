import type {
    ProcessGitSubmissionPayload
} from "@modules/integrations/bullmq/types/payloads/process-git-submission"
import {
    JobActionService
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobExtendedContext
} from "@modules/bussiness/jobs/types/context"
import {
    AiCeilSurface
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelCategory
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    ModelProvider
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    Injectable
} from "@nestjs/common"
import {
    type EntityManager
} from "typeorm"
import {
    WinstonService
} from "@modules/platform/winston/winston.service"
import {
    envConfig
} from "@modules/platform/env/config"
import {
    GithubRepoLoader
} from "@langchain/community/document_loaders/web/github"
import {
    MountStorageService
} from "@modules/filesystem/mount-storage.service"
import {
    EncryptionService
} from "@modules/crypto/encryption.service"
import {
    Document
} from "@langchain/core/documents"
import {
    AiEntitlementService
} from "@modules/ai/ai-entitlement.service"
import {
    AiInvokeService
} from "@modules/ai/ai-invoke.service"
import {
    ChallengeEvaluationParseService
} from "../../shared/challenge-evaluation/challenge-evaluation-parse.service"
import {
    ChallengeEvaluationPromptService
} from "../../shared/challenge-evaluation/challenge-evaluation-prompt.service"
import type {
    ProcessGitSubmissionGradeStepExecuteResult
} from "../types/execute"
import type {
    ExtendedProcessGitSubmissionContext
} from "../types/extended"
import {
    collectSubmissionCriteria
} from "../../shared/challenge-submission/utils/collect-submission-criteria"
import {
    resolveTargetLanguage
} from "../../shared/challenge-submission/utils/resolve-target-language"
import {
    resolveGithubAccessToken
} from "../../shared/challenge-submission/utils/resolve-github-access-token"
import {
    GradingRetrievalService
} from "@modules/integrations/rag/grading-rag-retrieval.service"
import {
    AbstractSubmissionGradeStepService
} from "../../shared/challenge-submission/abstract-submission-grade-step.service"
import {
    ChallengeEvaluationLowConfidenceException
} from "@modules/platform/exceptions/errors/ai/challenge-evaluation-low-confidence"
import {
    GitRepositoryLoadFailedException
} from "@modules/platform/exceptions/errors/submission-review/git-repository-load-failed"

const MIN_EVALUATION_CONFIDENCE = 0.75

@Injectable()
/**
 * SCHEMA V2 grade step (stepIndex 0). Mirrors the legacy git grade step but grades the submitted
 * repo against the challenge's outcome + approach (per-language) yes/no criteria instead of the
 * relational requirements. Outputs the same evaluation template shape so the legacy complete step
 * and parse service can be reused. Uses the same `stepName` ("grade") as V1 so the complete step
 * reads the result transparently.
 *
 * `process` + persisting the result are shared verbatim with the Google-Docs grade step -- see
 * {@link AbstractSubmissionGradeStepService}. This class only owns HOW the evaluation is produced:
 * cloning the submitted repo and grading it at the code-grading AI floor.
 */
export class ProcessGitSubmissionGradeStepService extends AbstractSubmissionGradeStepService<
  ProcessGitSubmissionPayload,
  ExtendedProcessGitSubmissionContext,
  ProcessGitSubmissionGradeStepExecuteResult
> {
    constructor(
    @InjectPrimaryPostgreSQLEntityManager()
        entityManager: EntityManager,
        jobActionService: JobActionService,
        winstonService: WinstonService,
    private readonly mountStorageService: MountStorageService,
    private readonly aiInvokeService: AiInvokeService,
    private readonly aiEntitlementService: AiEntitlementService,
    private readonly challengeEvaluationParseService: ChallengeEvaluationParseService,
    private readonly challengeEvaluationPromptService: ChallengeEvaluationPromptService,
    private readonly gradingRetrievalService: GradingRetrievalService,
    private readonly encryptionService: EncryptionService,
    ) {
        super(entityManager,
            jobActionService,
            winstonService)
    }

    /**
   * Execute the grade step: load repo -> similarity search on criteria -> LLM grades each criterion.
   */
    protected async execute(
        context: JobExtendedContext<
      ProcessGitSubmissionPayload,
      ExtendedProcessGitSubmissionContext
    >,
    ): Promise<ProcessGitSubmissionGradeStepExecuteResult> {
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
        const repoUrl =
      context.extended?.userChallengeSubmission.submissionUrl ?? ""
        // private student repos need the learner's own token (org token can't read a
        // user's private repo); falls back to the org token for public/org repos
        const accessToken = await resolveGithubAccessToken({
            entityManager: this.entityManager,
            encryptionService: this.encryptionService,
            fallbackAccessToken: this.mountStorageService.githubAccessToken,
            enrollmentId: payload.enrollmentId,
        })
        const branch =
      payload.branch ?? (await this.resolveDefaultBranch(repoUrl,
          accessToken))

        /** Load GitHub repo */
        const gitLoader = new GithubRepoLoader(repoUrl,
            {
                branch,
                recursive: true,
                accessToken,
                verbose: true,
                ignorePaths: ["package-lock.json",
                    "dist",
                    "node_modules",
                    ".git"],
            })
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
        const { excerpt: sourceExcerpt } =
      await this.gradingRetrievalService.retrieveGradingExcerpt({
          runKey: `${payload.userChallengeSubmissionId}-${context.job.fencingToken}`,
          documents: docs,
          criteria,
          chunkSize: gradingCfg.chunkSize,
          chunkOverlap: gradingCfg.chunkOverlap,
          embedding: {
              model: payload.embeddingModel ?? gradingCfg.embedding.model,
              provider:
            payload.embeddingProvider ??
            (gradingCfg.embedding.provider as ModelProvider),
          },
          maxChars: gradingCfg.gradingMaxSourceChars,
          perCriterionTopK: gradingCfg.gradingPerCriterionTopK,
          jobId: context.job.id ?? "",
      })
        // CACHE INVARIANT: the builder keeps submission-specific source in the HumanMessage.
        const { messages, maxScore } = this.challengeEvaluationPromptService.build({
            source: "code",
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
        // ONE shared entry: CODE grading (githubUrl submission) floors at Balanced
        // -- NOT by difficulty. Eval evidence: Free/Economy models grade code too
        // shallowly (miss subtle API-contract defects); text grading (googleDocs /
        // interview) stays at Economy. Climbs to the tier ceiling -> served + cost.
        const {
            text: raw,
            model,
            provider,
            attempts,
            cost,
            promptTokens,
            completionTokens,
            cachedTokens,
        } = await this.aiInvokeService.run({
            userId: enrollment.userId,
            messages,
            selection: payload.ai,
            floor: AiModelCategory.Medium,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.ChallengeGrading,
            // all submissions of one challenge share the rubric prefix -> one route
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

        const parsed = this.challengeEvaluationParseService.parse(raw,
            {
                criteria,
                source: "code",
            })
        if (
            parsed.confidence !== undefined &&
      parsed.confidence < MIN_EVALUATION_CONFIDENCE
        ) {
            throw new ChallengeEvaluationLowConfidenceException({
                confidence: parsed.confidence ?? 0,
                threshold: MIN_EVALUATION_CONFIDENCE,
            })
        }
        const passThreshold =
      this.mountStorageService.appConfig.systemConfig.challenge.passThreshold
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

    /** Resolves the repository's declared default branch without trusting user input as a fetch target. */
    private async resolveDefaultBranch(
        repositoryUrl: string,
        accessToken?: string,
    ): Promise<string> {
        const match =
      /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(
          repositoryUrl.trim(),
      )
        if (!match) return "main"
        const [, owner,
            repository] = match
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repository}`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    ...(accessToken
                        ? {
                            Authorization: `Bearer ${accessToken}`,
                        }
                        : {
                        }),
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            },
        )
        if (!response.ok) {
            throw new GitRepositoryLoadFailedException({
                repoUrl: repositoryUrl,
                branch: "default",
                originalError: new Error(
                    `GitHub repository metadata responded with status ${response.status}`,
                ),
            })
        }
        const metadata = (await response.json()) as { default_branch?: unknown }
        return typeof metadata.default_branch === "string" &&
      metadata.default_branch.trim() !== ""
            ? metadata.default_branch
            : "main"
    }
}
