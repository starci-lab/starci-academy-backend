import type {
    ProcessGoogleDocsSubmissionPayload,
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
} from "@modules/bullmq"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ProcessGoogleDocsSubmissionSplitDocsStepExecuteResult,
    ProcessGoogleDocsSubmissionVectorizeStepExecuteResult,
    ExtendedProcessGoogleDocsSubmissionContext,
} from "../types"
import {
    JobExtendedContext,
} from "../../types"
import {
    envConfig,
} from "@modules/env"
import {
    EmbeddingModelService,
} from "@modules/langchain"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import {
    ProcessGoogleDocsSubmissionSplitDocsStepService,
} from "./process-submission-split-docs-step.service"

/**
 * Step 3: vectorize document chunks.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionVectorizeStepService extends AbstractStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly processGoogleDocsSubmissionSplitDocsStepService: ProcessGoogleDocsSubmissionSplitDocsStepService,
        private readonly embeddingModelService: EmbeddingModelService,
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
    ) {
        super()
    }

    stepIndex = 2

    stepName = "vectorize"

    /**
     * Process the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is processed.
     */
    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        // execute the step
        const executionResult = await this.execute(context)
        // finalize the step
        await this.finalize(executionResult, context)
    }

    /**
     * Execute the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is executed.
     */
    private async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<ProcessGoogleDocsSubmissionVectorizeStepExecuteResult> {
        const splitResult = await this.jobActionService.loadExecutionResult<ProcessGoogleDocsSubmissionSplitDocsStepExecuteResult>({
            job: context.job,
            key: this.processGoogleDocsSubmissionSplitDocsStepService.stepName,
        })

        const collectionName = `grading-${context.payload.userChallengeSubmissionId}`

        const embeddingModel = this.embeddingModelService.get({
            model: context.payload.embeddingModel ?? envConfig().services.githubWorker.processGitSubmission.embedding.model,
            provider: (context.payload.embeddingProvider ?? envConfig().services.githubWorker.processGitSubmission.embedding.provider) as ModelProvider,
        })

        await this.qdrantClient.deleteCollection(collectionName)
        await QdrantVectorStore.fromDocuments(
            splitResult.chunks,
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName,
            },
        )

        return {}
    }

    /**
     * Finalize the step.
     * @param executionResult - Execution result of the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        executionResult: ProcessGoogleDocsSubmissionVectorizeStepExecuteResult,
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context

        await this.entityManager.transaction(async (entityManager) => {
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
        })

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
