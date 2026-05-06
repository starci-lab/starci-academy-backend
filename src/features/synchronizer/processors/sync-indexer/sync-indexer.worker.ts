import {
    BullQueueName,
    SyncIndexerPayload,
    bullData,
} from "@modules/bullmq"
import {
    JobActionService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    envConfig,
} from "@modules/env"
import {
    DayjsService,
    InjectSuperJson,
} from "@modules/mixin"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import type {
    Job,
} from "bullmq"
import SuperJSON from "superjson"
import {
    SyncIndexerStepMappingService,
} from "./step-mapping.service"
import type {
    JobEntity,
} from "@modules/databases"

/**
 * Worker: Sync indexer (parent-chain cache priming).
 * @deprecated Replaced by {@link SyncOrchestratorService} in core module. Kept for reference.
 */
@Worker(
    bullData[BullQueueName.SyncIndexer].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class SyncIndexerWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: SyncIndexerStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    async process(bullmqJob: Job<string>) {
        const startedAt = this.dayjsService.now()
        let payload: SyncIndexerPayload | undefined
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

            payload = this.superJson.parse<SyncIndexerPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()

            const context: JobExtendedContext<
                SyncIndexerPayload,
                EmptyObject
            > = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                },
            }

            while (job.currentStep < job.maxSteps) {
                const syncedJob = await this.jobActionService.getJob(
                    {
                        id: job.id,
                    },
                )
                job = syncedJob
                context.job = job
                await stepMap.get(syncedJob.currentStep)?.process(context)
            }

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
                    error: (error as Error).message,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            throw error
        }
    }
}

