import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    MilestoneTaskEntity,
    UserMilestoneTaskEntity,
    UserMilestoneTaskAttemptEntity,
    UserMilestoneTaskAttemptFeedbackEntity,
    MilestoneSeverity,
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
    DayjsService,
} from "@modules/mixin"
import {
    EmbeddingModelService,
    ModelService,
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
import {
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    Document,
} from "@langchain/core/documents"
import {
    ReviewPersonalProjectModelRouterService
} from "@modules/ai"

/**
 * Step 0: Load GitHub repo → LLM grades per criterion (yes/no + score) → persist attempt + feedback.
 * Also ensures the UserMilestoneTask record exists for the given enrollment + milestoneTask.
 */
@Injectable()
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
        private readonly embeddingModelService: EmbeddingModelService,
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly modelService: ModelService,
        private readonly reviewPersonalProjectModelRouterService: ReviewPersonalProjectModelRouterService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
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
                    emitChangeEvent: false,
                },
            )
            throw error
        }
    }

    /**
     * Execute the step.
     */
    private async execute(
        context: JobExtendedContext<ReviewPersonalProjectTaskPayload, EmptyObject>,
    ): Promise<ReviewMilestoneTaskGradeResult> {
        const { payload } = context
        const model = this.reviewPersonalProjectModelRouterService.model ?? envConfig().services.githubWorker.processGitSubmission.grading.model
        const provider = this.reviewPersonalProjectModelRouterService.provider ?? envConfig().services.githubWorker.processGitSubmission.grading.provider as ModelProvider
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
                    criteria: {
                        translations: true,
                    },
                },
            },
        )
        const criteria = milestoneTask.criteria ?? []

        /** Load GitHub repo */
        const repoUrl = payload.githubUrl
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

        /** Vectorize into Qdrant. */
        const collectionName = `review-milestone-task-${payload.enrollmentId}-${payload.taskId}`
        const embeddingModel = this.embeddingModelService.get(
            {
                model: envConfig().services.githubWorker.processGitSubmission.embedding.model,
                provider: envConfig().services.githubWorker.processGitSubmission.embedding.provider as ModelProvider,
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

        /** Build source excerpt using criteria translations for the target locale */
        const criteriaQueryText = criteria
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
            .map((criterion) => {
                const translations = criterion.translations?.filter(
                    (translation) => translation.locale === locale,
                ) ?? criterion.translations ?? []
                const text = translations.find((text) => text.field === "text")?.value ?? ""
                const promptText = translations.find((translation) => translation.field === "promptText")?.value ?? ""
                return `${text}\n${promptText}`
            })
            .join("\n\n")
        const topChunks = await vectorStore.similaritySearch(
            criteriaQueryText || milestoneTask.title || "code review",
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
        /** Grade per criteria via LLM */
        let criteriaResults: Array<CriteriaResult> = []
        let totalScore = 0

        if (criteria.length > 0) {
            /** Build criteria prompt */
            const criteriaPromptSections = criteria
                .sort((prev, next) => prev.orderIndex - next.orderIndex)
                .map(
                    (criterion, index) => {
                        const translations = criterion.translations?.filter(
                            (translation) => translation.locale === locale,
                        ) ?? criterion.translations ?? []
                        const text = translations.find((translation) => translation.field === "text")?.value ?? ""
                        const promptText = translations.find((translation) => translation.field === "promptText")?.value ?? ""
                        return `### Criterion ${index + 1} (id: "${criterion.id}", score: ${criterion.score})\nDisplay text: ${text}\nGrading prompt: ${promptText}`
                    },
                )
                .join("\n\n")

            const taskTitle = milestoneTask.title ?? "milestone task"
            const systemText = [
                `You are a senior engineer reviewing a learner's personal project for task: "${taskTitle}".`,
                "Review the code against EACH pass criterion below.",
                "For EACH criterion, determine if the code meets the requirement (passed = true/false) and provide brief feedback.",
                "If not passed, include location (file:line) and suggestion for fix.",
                "",
                "### IMPORTANT: Language Requirement",
                `All feedback text MUST be written in **${targetLanguage}**.`,
                `The JSON keys must remain in English, but all human-readable values (feedback, location, suggestion) must be in ${targetLanguage}.`,
                "",
                "### Pass Criteria",
                criteriaPromptSections || "(no criteria provided)",
                "",
                "Respond with JSON only — no markdown fences, no extra text.",
                "Shape:",
                "{\"criteriaResults\": [{\"criteriaId\": \"<uuid>\", \"passed\": <boolean>, \"feedback\": \"<brief explanation>\", \"location\": \"<file:line or null>\", \"suggestion\": \"<code snippet or instruction or null>\"}]}",
                "",
                "Rules:",
                "- criteriaResults must have exactly one entry per criterion, in order.",
                "- criteriaId must match the criterion id provided above.",
                "- passed: true if the code meets the criterion, false otherwise.",
                `- feedback: 1-2 sentences in ${targetLanguage} explaining why it passed or failed.`,
                "- location: file path and line number hint where the issue is, or null if passed.",
                "- suggestion: code snippet or instruction to fix the issue, or null if passed.",
                "- Focus on implementation completeness, NOT code style.",
                "- Output must be STRICT JSON (double quotes only).",
            ].filter(Boolean).join("\n")

            const humanText = [
                "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
                "",
                sourceExcerpt || "(empty repository excerpt)",
            ].join("\n")

            const aiModel = this.modelService.get({
                model,
                provider: provider,
            })

            const response = await aiModel.invoke([
                new SystemMessage(systemText),
                new HumanMessage(humanText),
            ])

            const raw = typeof response.content === "string"
                ? response.content
                : String(response.content)

            const gradeResult = this.parseResult(raw)

            // Map parsed results and calculate scores
            criteriaResults = gradeResult.criteriaResults.map((cr) => {
                const matchingCriteria = criteria.find((c) => c.id === cr.criteriaId)
                const score = cr.passed && matchingCriteria ? matchingCriteria.score : 0
                return {
                    criteriaId: cr.criteriaId,
                    passed: cr.passed,
                    feedback: cr.feedback,
                    location: cr.location ?? null,
                    suggestion: cr.suggestion ?? null,
                    score,
                }
            })
            totalScore = criteriaResults.reduce(
                (sum, cr) => sum + cr.score,
                0
            )
        }

        const passThreshold = this.mountStorageService.appConfig.systemConfig.task.passThreshold
        const passed = totalScore >= milestoneTask.maxScore * passThreshold

        /** Persist userMilestoneTask + attempt + feedback in a single transaction */
        let userMilestoneTaskId: string = ""
        await this.entityManager.transaction(
            async (entityManager) => {
                /** Ensure UserMilestoneTask exists for this enrollment + milestone task */
                let userMilestoneTask = await entityManager.findOne(
                    UserMilestoneTaskEntity,
                    {
                        where: {
                            enrollment: {
                                id: payload.enrollmentId
                            },
                            milestoneTask: {
                                id: payload.taskId
                            },
                        },
                    },
                )
                if (!userMilestoneTask) {
                    userMilestoneTask = await entityManager.save(
                        UserMilestoneTaskEntity,
                        {
                            enrollment: {
                                id: payload.enrollmentId
                            },
                            milestoneTask: {
                                id: payload.taskId
                            },
                            orderIndex: 0,
                        },
                    )
                }
                userMilestoneTaskId = userMilestoneTask.id
                /** Count existing attempts */
                const existingAttempts = await entityManager.count(
                    UserMilestoneTaskAttemptEntity,
                    {
                        where: {
                            userMilestoneTask: {
                                id: userMilestoneTask.id,
                            },
                        },
                    },
                )
                /** Create the attempt */
                const attempt = await entityManager.save(
                    UserMilestoneTaskAttemptEntity,
                    {
                        userMilestoneTask: {
                            id: userMilestoneTask.id,
                        },
                        attemptNumber: existingAttempts + 1,
                        submissionUrl: payload.githubUrl,
                        score: totalScore,
                        shortFeedback: passed
                            ? "All criteria passed."
                            : `${criteriaResults.filter((cr) => !cr.passed).length} criteria failed.`,
                        processedAt: this.dayjsService.now().toDate(),
                        defaultLocale: locale,
                    },
                )
                /** Create feedback entries for each criterion that did NOT pass */
                const failedCriteria = criteriaResults.filter((cr) => !cr.passed)
                if (failedCriteria.length > 0) {
                    const feedbackEntities = failedCriteria.map(
                        (cr, index) =>
                            entityManager.create(
                                UserMilestoneTaskAttemptFeedbackEntity,
                                {
                                    attempt: {
                                        id: attempt.id,
                                    },
                                    message: cr.feedback,
                                    detail: null,
                                    severity: MilestoneSeverity.Medium,
                                    orderIndex: index,
                                    location: cr.location ?? null,
                                    suggestion: cr.suggestion ?? null,
                                    defaultLocale: locale,
                                },
                            ),
                    )
                    await entityManager.save(
                        UserMilestoneTaskAttemptFeedbackEntity,
                        feedbackEntities,
                    )
                }
            })

        return {
            enrollmentId: payload.enrollmentId,
            milestoneTaskId: milestoneTask.id,
            userMilestoneTaskId,
            githubUrl: payload.githubUrl,
            totalScore,
            maxScore: milestoneTask.maxScore,
            passed,
            criteriaCount: criteria.length,
            failedCriteriaCount: criteriaResults.filter((cr) => !cr.passed).length,
            sourceExcerptChars: sourceExcerpt.length,
            locale,
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

    /** Parse the result. */
    private parseResult(text: string): {
        criteriaResults: Array<ParsedCriteriaResult>
    } {
        const first = text.indexOf("{")
        const last = text.lastIndexOf("}")
        if (first !== -1 && last !== -1 && last > first) {
            const parsed = JSON.parse(text.slice(first,
                last + 1))
            if (Array.isArray(parsed.criteriaResults)) {
                return {
                    criteriaResults: parsed.criteriaResults
                        .filter((cr: ParsedCriteriaResult) => typeof cr.criteriaId === "string")
                        .map((cr: ParsedCriteriaResult) => ({
                            criteriaId: cr.criteriaId,
                            passed: Boolean(cr.passed),
                            feedback: typeof cr.feedback === "string" ? cr.feedback.trim() : "",
                            location: typeof cr.location === "string" ? cr.location.trim() : null,
                            suggestion: typeof cr.suggestion === "string" ? cr.suggestion.trim() : null,
                        })),
                }
            }
        }
        throw new ParsingCriteriaResultsFromModelTextException({
            text,
        })
    }
}

/**
 * Parsed criteria result from LLM (before score calculation).
 */
interface ParsedCriteriaResult {
    criteriaId: string
    passed: boolean
    feedback: string
    location: string | null
    suggestion: string | null
}

/**
 * Criteria result with calculated score (internal only, not in execution result).
 */
interface CriteriaResult {
    criteriaId: string
    passed: boolean
    feedback: string
    location: string | null
    suggestion: string | null
    score: number
}

/**
 * Review milestone task grade result interface.
 */
export interface ReviewMilestoneTaskGradeResult {
    /** The enrollment ID. */
    enrollmentId: string
    /** The milestone task ID. */
    milestoneTaskId: string
    /** The user milestone task ID. */
    userMilestoneTaskId: string
    /** The GitHub URL. */
    githubUrl: string
    /** Total score achieved. */
    totalScore: number
    /** Maximum possible score for the task. */
    maxScore: number
    /** Whether the task passed (totalScore >= maxScore). */
    passed: boolean
    /** Total criteria count. */
    criteriaCount: number
    /** Number of failed criteria. */
    failedCriteriaCount: number
    /** The number of characters in the source excerpt. */
    sourceExcerptChars: number
    /** The locale used for grading. */
    locale: string
}
