import type {
    ProccessGitUrlPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    InjectQdrantClient,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "../../abstracts"
import type {
    ProccessGitUrlPipelineContext,
} from "../types"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    JobContext 
} from "../../types"

/**
 * Step 3: embed chunks and upsert into Qdrant.
 */
@Injectable()
export class ProccessGitUrlVectorizeStepService extends AbstractStepService<ProccessGitUrlPayload> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    /**
     * The index of the step.
     */
    stepIndex = 2

    stepName = "vectorize"

    /**
     * Process the step: embed chunks and upsert into Qdrant.
     * @param context - The context.
     * @returns The void.
     */
    async process(
        context: JobContext<ProccessGitUrlPayload>,
    ): Promise<void> {
        const pipeline = context as ProccessGitUrlPipelineContext
        await this.execute(pipeline)
        await this.finalize(pipeline)
    }

    /**
     * Execute the step: embed chunks and upsert into Qdrant.
     * @param context - The context.
     * @returns The void.
     */
    private async execute(
        context: ProccessGitUrlPipelineContext,
    ): Promise<void> {
        const chunks = context.chunks
        if (!chunks?.length) {
            throw new Error(
                "No chunks to vectorize; cannot run vectorize step.",
            )
        }
        const githubWorkerConfig = envConfig().services.githubWorker.processGitUrl
        const collectionName = `grading-${context.payload.jobId}`
        await QdrantVectorStore.fromDocuments(
            chunks,
            new GoogleGenerativeAIEmbeddings({
                model: githubWorkerConfig.embeddingModel,
                apiKey: githubWorkerConfig.genAiApiKey,
            }),
            {
                client: this.qdrantClient,
                collectionName,
            },
        )
    }

    /**
     * Finalize the step: save the result to the database.
     * @param context - The context.
     * @returns The void.
     */
    private async finalize(
        context: ProccessGitUrlPipelineContext,
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
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult: {
                        },
                        entityManager,
                    },
                )
            },
        )
        this.winstonService.log(
            WinstonLog.ProcessGitUrlStepExecuted,
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
