import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/integrations/bullmq/types/payloads/review-personal-project-task"
import type {
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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
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
    ProjectEvaluationParseService,
} from "../../shared/project-evaluation/project-evaluation-parse.service"
import {
    collectMilestoneTaskCriteria,
} from "../../shared/milestone-task/utils/collect-task-criteria"
import {
    renderCriteriaPromptSections,
} from "../../shared/challenge-submission/utils/render-criteria-prompt-sections"

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
        private readonly projectEvaluationParseService: ProjectEvaluationParseService,
        private readonly encryptionService: EncryptionService,
    ) {
        super()
    }

    /**
     * Resolve the GitHub access token to clone with: the learner's own (decrypted) token when they
     * stored one for a PRIVATE repo, otherwise the org token. A token that fails to decrypt falls
     * back to the org token rather than aborting the grade.
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
        const isV2Task = Boolean(milestoneTask.verified)
        const v2Criteria = isV2Task
            ? collectMilestoneTaskCriteria(milestoneTask,
                payload.lang)
            : []

        /** Load GitHub repo -- auth with the learner's own token for a private repo, else the org token. */
        const repoUrl = payload.githubUrl
        const githubAccessToken = await this.resolveGithubAccessToken(payload.enrollmentId)
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
        const docs = loadedDocs.map(
            (doc) =>
                new Document({
                    pageContent: doc.pageContent,
                    metadata: doc.metadata,
                    id: doc.id,
                }),
        )

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

        /** V2 max total = sum of explicit criterion scores (e.g. 100); legacy = task.maxScore. */
        const gradeMaxScore = isV2Task
            ? v2Criteria.reduce((sum, criterion) => sum + criterion.score,
                0)
            : milestoneTask.maxScore

        /** Build criteria prompt + system instruction (V2 yes/no+critical vs legacy rubric). */
        let systemText: string
        if (isV2Task) {
            const criteriaPromptSections = renderCriteriaPromptSections(v2Criteria)
            systemText = [
                `You are a strict, experienced code reviewer grading a learner's personal project for task: "${taskTitle}".`,
                "",
                "## Task",
                "Grade the submitted source code against EVERY yes/no criterion listed below.",
                "Each criterion is binary: it is either MET (award its full score) or NOT MET (award 0).",
                "Do NOT award partial credit for a single criterion.",
                "",
                "## Critical criteria",
                "Some criteria are marked **CRITICAL**. If ANY critical criterion is NOT MET, the TOTAL score is 0 for the whole task, regardless of the other criteria.",
                "",
                "## IMPORTANT: Language Requirement",
                `All feedback text MUST be written in **${targetLanguage}**.`,
                `JSON keys must remain in English, but all human-readable values (shortFeedback, message, suggestion) must be in ${targetLanguage}.`,
                "",
                "## Criteria",
                criteriaPromptSections || "(no criteria provided)",
                "",
                `## Scoring (max total: ${gradeMaxScore})`,
                "- total score = sum of the scores of every MET criterion.",
                "- If any CRITICAL criterion is NOT MET, set the total score to 0.",
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
                "- Focus on implementation correctness and the evidence each criterion describes, NOT code style.",
                "- Before deciding, ACTUALLY READ the source files (e.g. *.ts/*.java/*.cs/*.go), not just the README.",
                "- Add a feedback item per criterion stating whether it was met and the concrete `file:line` evidence.",
                "- Only mark NOT MET when, after inspecting the relevant code, the evidence is genuinely absent.",
            ].filter(Boolean).join("\n")
        } else {
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
            systemText = [
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
        }

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


