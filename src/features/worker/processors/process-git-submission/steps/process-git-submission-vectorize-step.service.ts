import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ModelProvider,
    InjectQdrantClient,
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
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionVectorizeStepExecuteResult
} from "../types"
import {
    JobExtendedContext
} from "../../types"
import {
    Document
} from "@langchain/core/documents"
import {
    ProcessGitSubmissionSplitDocsStepService
} from "./process-git-submission-split-docs-step.service"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    type QdrantClient,
} from "@qdrant/qdrant-js"
import {
    EmbeddingModelService
} from "@modules/langchain"
import {
    envConfig 
} from "@modules/env"

/**
 * Step 3: vectorize the chunks.
 */
@Injectable()
export class ProcessGitSubmissionVectorizeStepService extends AbstractStepService<ProcessGitSubmissionPayload, ExtendedProcessGitSubmissionContext> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly embeddingModelService: EmbeddingModelService,
        private readonly processGitSubmissionSplitDocsStepService: ProcessGitSubmissionSplitDocsStepService,
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
    ) {
        super()
    }

    /**
     * The index of the step.
     */
    stepIndex = 2

    /**
     * The name of the step.
     */
    stepName = "vectorize"

    /**
     * Process the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is processed.
     */
    async process(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<void> {
        // execute the step
        const executionResult = await this.execute(context)
        // finalize the step
        await this.finalize(executionResult,
            context)
    }



    /**
     * Execute the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is executed.
     */
    private async execute(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<ProcessGitSubmissionVectorizeStepExecuteResult> {
        // load the chunks
        const jsonChunks = await this.jobActionService.loadExecutionResult<Array<Document>>(
            {
                job: context.job,
                key: this.processGitSubmissionSplitDocsStepService.stepName,
            }
        )
        // convert the chunks to documents
        const chunks = jsonChunks.map((chunk) => new Document(
            {
                pageContent: chunk.pageContent,
                metadata: chunk.metadata,
            }
        ))
        // get the collection name
        const collectionName = `grading-${context.payload.userChallengeSubmissionId}`
        // get the embedding model
        const embeddingModel = this.embeddingModelService.get({
            model: context.payload.embeddingModel ?? envConfig().services.githubWorker.processGitSubmission.embedding.model,
            provider: (context.payload.embeddingProvider ?? envConfig().services.githubWorker.processGitSubmission.embedding.provider) as ModelProvider,
        })
        // remove the existing collection
        await this.qdrantClient.deleteCollection(collectionName)
        // vectorize the chunks
        await QdrantVectorStore.fromDocuments(
            chunks,
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName,
            },
        )
        return {
        }
    }
    /**
     * Finalize the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        /** Execution result of the step. */
        executionResult: ProcessGitSubmissionVectorizeStepExecuteResult,
        /** Context of the step. */
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
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    },
                )
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
