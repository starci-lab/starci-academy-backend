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
    MilestoneTaskEntity,
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
    Document,
} from "@langchain/core/documents"
import {
    ReviewPersonalProjectModelRouterService 
} from "@modules/ai"
/**
 * Step 0: Load GitHub repo → LLM grades per criterion → create attempt + save results.
 */
@Injectable()
export class ReviewPersonalProjectTaskGradeStepService extends AbstractStepService<
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
    ) {
        super()
    }

    stepIndex = 0
    stepName = "grade"

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
    ): Promise<ReviewPersonalProjectTaskGradeResult> {
        const { payload } = context
        const model = this.reviewPersonalProjectModelRouterService.model ?? envConfig().services.githubWorker.processGitSubmission.grading.model
        const provider = this.reviewPersonalProjectModelRouterService.provider ?? envConfig().services.githubWorker.processGitSubmission.grading.provider as ModelProvider
        const branch = payload.branch ?? "main"

        /** Load the specific milestone task with its pass criteria */
        const milestoneTask = await this.entityManager.findOneOrFail(
            MilestoneTaskEntity,
            {
                where: {
                    id: payload.milestoneTaskId
                },
                relations: {
                    passCriteria: true,
                },
            },
        )
        const passCriteria = milestoneTask.passCriteria ?? []
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

        /** Vectorize into Qdrant (same style as process-git-submission). */
        const collectionName = `review-personal-project-task-${payload.enrollmentId}-${payload.milestoneTaskId}`
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

        /** Build source excerpt */
        const criteriaQueryText = passCriteria
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
            .map((criterion) => `${criterion.text}\n${criterion.promptText}`)
            .join("\n\n")
        const topChunks = await vectorStore.similaritySearch(
            criteriaQueryText || milestoneTask.title,
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
        let criteriaResults: Array<{ passCriteriaId: string, passed: boolean, feedback: string }> = []
        let allPassed = true

        if (passCriteria.length > 0) {
            /** Build criteria prompt */
            const criteriaPromptSections = passCriteria
                .sort((prev, next) => prev.orderIndex - next.orderIndex)
                .map(
                    (criterion, index) =>
                        `### Criterion ${index + 1} (id: "${criterion.id}")\nDisplay text: ${criterion.text}\nGrading prompt: ${criterion.promptText}`,
                )
                .join("\n\n")

            const systemText = [
                `You are a senior engineer reviewing a learner's personal project for task: "${milestoneTask.title}".`,
                "Review the code against EACH pass criterion below.",
                "For EACH criterion, determine if the code meets the requirement (passed = true/false) and provide brief feedback.",
                "",
                "### Pass Criteria",
                criteriaPromptSections || "(no criteria provided)",
                "",
                "Respond with JSON only — no markdown fences, no extra text.",
                "Shape:",
                "{\"criteriaResults\": [{\"passCriteriaId\": \"<uuid>\", \"passed\": <boolean>, \"feedback\": \"<brief explanation>\"}]}",
                "",
                "Rules:",
                "- criteriaResults must have exactly one entry per criterion, in order.",
                "- passCriteriaId must match the criterion id provided above.",
                "- passed: true if the code meets the criterion, false otherwise.",
                "- feedback: 1-2 sentences explaining why it passed or failed.",
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
            criteriaResults = gradeResult.criteriaResults
            allPassed = criteriaResults.every((criteriaResult) => criteriaResult.passed)
        }
        return {
            enrollmentId: payload.enrollmentId,
            milestoneTaskId: milestoneTask.id,
            githubUrl: payload.githubUrl,
            criteriaResults,
            allPassed,
            sourceExcerptChars: sourceExcerpt.length,
            criteriaQueryText,
        }
    }

    /** Finalize the step. */
    private async finalize(
        executionResult: ReviewPersonalProjectTaskGradeResult,
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

    private parseResult(text: string): {
        criteriaResults: Array<{ passCriteriaId: string, passed: boolean, feedback: string }>
    } {
        const first = text.indexOf("{")
        const last = text.lastIndexOf("}")
        if (first !== -1 && last !== -1 && last > first) {
            const parsed = JSON.parse(text.slice(first,
                last + 1))
            if (Array.isArray(parsed.criteriaResults)) {
                return {
                    criteriaResults: parsed.criteriaResults
                        .filter((cr: any) => typeof cr?.passCriteriaId === "string")
                        .map((cr: any) => ({
                            passCriteriaId: cr.passCriteriaId,
                            passed: Boolean(cr.passed),
                            feedback: typeof cr.feedback === "string" ? cr.feedback.trim() : "",
                        })),
                }
            }
        }
        throw new Error(`Failed to parse per-criteria grading result from model output: ${text.slice(0,
            200)}`)
    }
}

export interface ReviewPersonalProjectTaskGradeResult {
    enrollmentId: string
    milestoneTaskId: string
    githubUrl: string
    criteriaResults: Array<{ passCriteriaId: string, passed: boolean, feedback: string }>
    allPassed: boolean
    sourceExcerptChars: number
    criteriaQueryText: string
}
