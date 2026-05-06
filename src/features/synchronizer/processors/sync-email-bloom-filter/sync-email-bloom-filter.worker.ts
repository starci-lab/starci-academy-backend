import {
    BullQueueName,
    SyncEmailBloomFilterPayload,
    bullData,
} from "@modules/bullmq"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job,
} from "bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    DayjsService,
} from "@modules/mixin"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    SyncEmailBloomFilterStepMappingService,
} from "./step-mapping.service"
import {
    JobExtendedContext,
} from "@modules/bussiness"
import {
    JobEntity,
} from "@modules/databases"
import SuperJSON from "superjson"
import {
    EmptyObject 
} from "@modules/common"

/**
 * Worker: Sync email bloom filter.
 * @deprecated Replaced by {@link SyncOrchestratorService} in core module. Kept for reference.
 */
@Worker(
    bullData[BullQueueName.SyncEmailBloomFilter].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class SyncEmailBloomFilterWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: SyncEmailBloomFilterStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    /**
     * Process the job.
     * @param bullmqJob - The BullMQ job.
     * @returns A promise that resolves when the job is processed.
     */
    async process(bullmqJob: Job<string>) {
        const startedAt = this.dayjsService.now()
        let payload: SyncEmailBloomFilterPayload | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                },
            )
            await this.jobActionService.processingJob({
                job,
                emitChangeEvent: false,
            })
            payload = this.superJson.parse<SyncEmailBloomFilterPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()

            const context: JobExtendedContext<
                SyncEmailBloomFilterPayload,
                EmptyObject
            > = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                },
            }

            while (job.currentStep < job.maxSteps) {
                // refresh the job record
                const syncedJob = await this.jobActionService.getJob(
                    {
                        id: job.id,
                    },
                )
                // update the job record
                job = syncedJob
                // update the context
                context.job = job
                // process the step
                await stepMap.get(syncedJob.currentStep)?.process(
                    context
                )
            }
            // complete the job
            await this.jobActionService.completeJob({
                job,
                emitChangeEvent: false,
            })
            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId: job.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
        } catch (error) {
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: job?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    error: error.message,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            // Rethrow to let BullMQ handle retries if configured
            throw error
        }
    }
}
