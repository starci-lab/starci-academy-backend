import {
    BullQueueName,
    JobExtendedContext,
    type SyncCdnPayload,
    bullData,
} from "@modules/bullmq"
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
    JobEntity,
} from "@modules/databases"
import {
    EmptyObject,
} from "@modules/common"
import SuperJSON from "superjson"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    SyncCdnStepMappingService,
} from "./step-mapping.service"

/**
 * CDN on-demand sync: `sync-cdn-entity` → `complete` (same control flow as sync-email-bloom-filter).
 */
@Worker(
    bullData[BullQueueName.SyncCdn].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class SyncCdnWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: SyncCdnStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    /**
     * Process the job.
     */
    async process(
        bullmqJob: Job<string>,
    ): Promise<void> {
        const startedAt = this.dayjsService.now()
        let payload: SyncCdnPayload | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                }
            )
            await this.jobActionService.processingJob(
                {
                    job 
                }
            )
            payload = this.superJson.parse<SyncCdnPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            const context: JobExtendedContext<SyncCdnPayload, EmptyObject> = {
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
                    }
                )
                job = syncedJob
                context.job = job
                await stepMap.get(
                    syncedJob.currentStep
                )?.process(
                    context
                )
            }
            await this.jobActionService.completeJob(
                {
                    job 
                }
            )
            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId: job.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(
                        this.dayjsService.from(
                            startedAt
                        )
                    ),
                }
            )
        } catch (error) {
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: job?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    error: error.message,
                    durationMs: this.dayjsService.now().diff(
                        this.dayjsService.from(
                            startedAt
                        )
                    ),
                }
            )
            throw error
        }
    }
}
