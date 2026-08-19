import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/integrations/bullmq/types/payloads/review-personal-project-task"
import type {
    LoadGithubDocumentsParams,
    ResolveGradingCriteriaParams,
    ResolvedGradingCriteria,
    ReviewMilestoneTaskGradeResult,
} from "../types/grade"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
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
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    GithubRepoLoader,
} from "@langchain/community/document_loaders/web/github"
import {
    GradingRetrievalService,
} from "@modules/integrations/rag/grading-rag-retrieval.service"
import {
    GitRepositoryAccessDeniedException,
} from "@modules/platform/exceptions/errors/submission-review/git-repository-access-denied"
import {
    GitRepositoryEmptyException,
} from "@modules/platform/exceptions/errors/submission-review/git-repository-empty"
import {
    GitRepositoryLoadFailedException,
} from "@modules/platform/exceptions/errors/submission-review/git-repository-load-failed"
import {
    GitRepositoryNotFoundException,
} from "@modules/platform/exceptions/errors/submission-review/git-repository-not-found"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
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
    ProjectEvaluationParseService,
} from "../../shared/project-evaluation/project-evaluation-parse.service"
import {
    ProjectEvaluationPromptService,
} from "../../shared/project-evaluation/project-evaluation-prompt.service"
import {
    collectMilestoneTaskCriteria,
} from "../../shared/milestone-task/utils/collect-task-criteria"
import {
    resolveTargetLanguage,
} from "../../shared/challenge-submission/utils/resolve-target-language"
import {
    resolveGithubAccessToken,
} from "../../shared/challenge-submission/utils/resolve-github-access-token"

@Injectable()
/**
 * Step 0: Load GitHub repo -> LLM grades per criterion (yes/no + score) -> persist attempt + feedback.
 * Also ensures the UserMilestoneTask record exists for the given enrollment + milestoneTask.
 */
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
        private readonly gradingRetrievalService: GradingRetrievalService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly dayjsService: DayjsService,
        private readonly projectEvaluationPromptService: ProjectEvaluationPromptService,
        private readonly projectEvaluationParseService: ProjectEvaluationParseService,
        private readonly encryptionService: EncryptionService,
    ) {
        super()
    }

    /**
     * Load the submission's GitHub repo and map loader failures to the specific domain
     * exception the caller should surface (not-found / access-denied / generic load failure).
     * @param params - Repo location and the enrollment whose token should authenticate the clone.
     * @returns The repo's documents, converted to LangChain documents. Never empty.
     */
    private async loadGithubDocuments(
        {
            repoUrl,
            branch,
            enrollmentId,
        }: LoadGithubDocumentsParams,
    ): Promise<Array<Document>> {
        const githubAccessToken = await resolveGithubAccessToken({
            entityManager: this.entityManager,
            encryptionService: this.encryptionService,
            fallbackAccessToken: this.mountStorageService.githubAccessToken,
            enrollmentId,
        })
        const gitLoader = new GithubRepoLoader(
            repoUrl,
            {
                branch,
                recursive: true,
                accessToken: githubAccessToken,
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
                throw new GitRepositoryNotFoundException({
                    repoUrl,
                    branch,
                    originalError: error instanceof Error ? error : new Error(String(error)),
                })
            }
            if (msg.includes("403")) {
                throw new GitRepositoryAccessDeniedException({
                    repoUrl,
                    originalError: error instanceof Error ? error : new Error(String(error)),
                })
            }
            throw new GitRepositoryLoadFailedException({
                repoUrl,
                branch,
                originalError: error instanceof Error ? error : new Error(String(error)),
            })
        }
        if (loadedDocs.length === 0) {
            throw new GitRepositoryEmptyException({
                repoUrl,
                branch,
            })
        }
        return loadedDocs.map(
            (doc) =>
                new Document({
                    pageContent: doc.pageContent,
                    metadata: doc.metadata,
                    id: doc.id,
                }),
        )
    }

    /**
     * Decide which criteria set grades this task: SCHEMA V2 tasks use the per-language
     * outcome/approach yes/no criteria; legacy tasks use the text/promptText/score criteria.
     * @param params - The task, its legacy criteria, and the learner's chosen language.
     * @returns The resolved criteria, their retrieval queries, and the max score.
     */
    private resolveGradingCriteria(
        {
            milestoneTask,
            criteria,
            lang,
        }: ResolveGradingCriteriaParams,
    ): ResolvedGradingCriteria {
        const isV2Task = Boolean(milestoneTask.verified)
        const v2Criteria = isV2Task
            ? collectMilestoneTaskCriteria(milestoneTask,
                lang)
            : []
        /** Map criteria -> retrieval queries (V2 yes/no body, else legacy text + prompt). */
        const retrievalCriteria = isV2Task
            ? v2Criteria.map((criterion) => ({
                body: criterion.body
            }))
            : criteria
                .slice()
                .sort((prev, next) => prev.orderIndex - next.orderIndex)
                .map((criterion) => ({
                    body: `${criterion.text}\n${criterion.promptText}`
                }))
        /** V2 max total = sum of explicit criterion scores (e.g. 100); legacy = task.maxScore. */
        const gradeMaxScore = isV2Task
            ? v2Criteria.reduce((sum, criterion) => sum + criterion.score,
                0)
            : milestoneTask.maxScore
        return {
            isV2Task,
            v2Criteria,
            retrievalCriteria,
            gradeMaxScore,
        }
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
        const targetLanguage = resolveTargetLanguage(payload.locale)

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
                    outcomeCriteria: {
                        langs: true,
                    },
                    approachCriteria: {
                        langs: true,
                    },
                },
            },
        )
        const criteria = milestoneTask.criterias ?? []

        /**
         * SCHEMA V2 tasks (non-null `verified`) grade against the per-language outcome/approach
         * yes/no criteria (jsonb) resolved to the learner's chosen language; legacy tasks keep the
         * old `criterias` (text/promptText/score) path.
         */
        const {
            isV2Task,
            v2Criteria,
            retrievalCriteria,
            gradeMaxScore,
        } = this.resolveGradingCriteria({
            milestoneTask,
            criteria,
            lang: payload.lang,
        })

        /** Load GitHub repo -- auth with the learner's own token for a private repo, else the org token. */
        const repoUrl = payload.githubUrl
        const docs = await this.loadGithubDocuments({
            repoUrl,
            branch,
            enrollmentId: payload.enrollmentId,
        })

        /** ONE high-level RAG call owns chunk -> embed -> retrieve; the worker only gathers
            the source docs + criteria. The run namespace includes the fencing token so a
            stalled re-dispatch can never corrupt the live owner's vectors mid-search. */
        const gradingCfg = envConfig().services.githubWorker.processGitSubmission
        const { excerpt: sourceExcerpt } = await this.gradingRetrievalService.retrieveGradingExcerpt(
            {
                runKey: `review-milestone-task-${payload.enrollmentId}-${payload.taskId}-${context.job.fencingToken}`,
                documents: docs,
                criteria: retrievalCriteria,
                chunkSize: gradingCfg.chunkSize,
                chunkOverlap: gradingCfg.chunkOverlap,
                embedding: {
                    model: gradingCfg.embedding.model,
                    provider: gradingCfg.embedding.provider as ModelProvider,
                },
                maxChars: gradingCfg.gradingMaxSourceChars,
                perCriterionTopK: gradingCfg.gradingPerCriterionTopK,
                jobId: context.job.id ?? "",
            },
        )
        const taskTitle = milestoneTask.title ?? "milestone task"

        /** Delegate prompt formatting while retaining RAG, quota, invocation and parsing here. */
        const {
            systemText,
            humanText,
        } = isV2Task
            ? this.projectEvaluationPromptService.build({
                kind: "v2",
                taskTitle,
                targetLanguage,
                sourceExcerpt,
                criteria: v2Criteria,
                gradeMaxScore,
            })
            : this.projectEvaluationPromptService.build({
                kind: "legacy",
                taskTitle,
                targetLanguage,
                sourceExcerpt,
                criteria,
            })

        /** Resolve + debit the submitter's AI quota once for this grading job. */
        const enrollment = await this.entityManager.findOneOrFail(
            EnrollmentEntity,
            {
                where: {
                    id: payload.enrollmentId,
                },
            },
        )
        /** Gate on the SAME unified credit pool as everywhere else. */
        await this.aiEntitlementService.assertNotOverQuota({
            userId: enrollment.userId,
        })
        // ONE shared entry: capstone tasks are CODE (github repo) -> floor at Balanced
        // like challenge code grading (Free/Economy grade code too shallowly per eval).
        // Climbs to the tier ceiling. Credit charge happens in the complete step
        // (by the stored served model).
        const {
            text: raw, model, provider, attempts, promptTokens, completionTokens, cachedTokens,
        } = await this.aiInvokeService.run({
            userId: enrollment.userId,
            messages: [
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ],
            selection: payload.ai,
            floor: AiModelCategory.Medium,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.TaskGrading,
            // every submission of one milestone task shares the criteria prefix
            cacheSessionId: milestoneTask.id,
        })

        const parsed = this.projectEvaluationParseService.parse(raw)
        const passThreshold = this.mountStorageService.appConfig.systemConfig.task.passThreshold
        const passed = parsed.score >= gradeMaxScore * passThreshold
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
