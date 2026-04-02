import type {
    ProccessGitUrlPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
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
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "../../abstracts"
import type {
    JobContext,
} from "../../types"
import type {
    ProccessGitUrlPipelineContext,
} from "../types"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"

/**
 * Step 2: split loaded documents into chunks for embedding.
 */
@Injectable()
export class ProccessGitUrlSplitDocsStepService extends AbstractStepService<ProccessGitUrlPayload> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
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
    stepName = "split-docs"

    /**
     * Process the step: split loaded documents into chunks for embedding.
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
     * Execute the step: split loaded documents into chunks for embedding.
     * @param context - The context.
     * @returns The void.
     */
    private async execute(
        context: ProccessGitUrlPipelineContext,
    ): Promise<void> {
        const docs = context.docs
        if (!docs?.length) {
            throw new Error(
                "No documents loaded; cannot run split-docs step.",
            )
        }
        const githubWorkerConfig = envConfig().services.githubWorker.processGitUrl
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: githubWorkerConfig.chunkSize,
            chunkOverlap: githubWorkerConfig.chunkOverlap,
        })
        context.chunks = await splitter.splitDocuments(docs)
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
        const chunkCount = context.chunks?.length ?? 0
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
                            chunkCount,
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
