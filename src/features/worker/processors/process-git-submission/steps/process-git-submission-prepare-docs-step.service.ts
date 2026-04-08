import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    InjectQdrantClient,
    ModelProvider,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "../../abstracts"
import type {
    JobExtendedContext,
} from "../../types"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    GithubRepoLoader,
} from "@langchain/community/document_loaders/web/github"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    Document,
} from "@langchain/core/documents"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import {
    EmbeddingModelService,
} from "@modules/langchain"
import {
    envConfig,
} from "@modules/env"
import {
    MountStorageService,
} from "@modules/filesystem"
import type {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionPrepareDocsStepExecuteResult,
} from "../types"

/**
 * Step 1: load repo docs → split into chunks → vectorize into Qdrant.
 */
@Injectable()
export class ProcessGitSubmissionPrepareDocsStepService extends AbstractStepService<
    ProcessGitSubmissionPayload,
    ExtendedProcessGitSubmissionContext
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
    ) {
        super()
    }

    stepIndex = 0

    stepName = "prepare-docs"

    async process(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<void> {
        const executionResult = await this.execute(context)
        await this.finalize(
            executionResult,
            context
        )
    }

    private async execute(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<ProcessGitSubmissionPrepareDocsStepExecuteResult> {
        const branch = context.payload.branch ?? "main"
        const repoUrl = context.extended?.userChallengeSubmission.submissionUrl ?? ""

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

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.githubWorker.processGitSubmission.chunkSize,
            chunkOverlap: envConfig().services.githubWorker.processGitSubmission.chunkOverlap,
        })
        const chunks = await splitter.splitDocuments(docs)

        const collectionName = `grading-${context.payload.userChallengeSubmissionId}`
        const embeddingModel = this.embeddingModelService.get({
            model: context.payload.embeddingModel ?? envConfig().services.githubWorker.processGitSubmission.embedding.model,
            provider: (context.payload.embeddingProvider ?? envConfig().services.githubWorker.processGitSubmission.embedding.provider) as ModelProvider,
        })

        await this.qdrantClient.deleteCollection(collectionName)
        await QdrantVectorStore.fromDocuments(
            chunks,
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName,
            },
        )

        return {
            chunks,
        }
    }

    private async finalize(
        executionResult: ProcessGitSubmissionPrepareDocsStepExecuteResult,
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
                await this.jobActionService.increaseJob({
                    job,
                    entityManager,
                })
                await this.jobActionService.saveExecutionResult({
                    job,
                    key: this.stepName,
                    executionResult,
                    entityManager,
                })
            },
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
