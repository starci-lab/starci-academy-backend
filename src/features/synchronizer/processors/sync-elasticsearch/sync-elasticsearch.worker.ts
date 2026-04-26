import {
    BullQueueName,
    type SyncElasticsearchPayload,
    bullData,
} from "@modules/bullmq"
import {
    JobActionService,
    JobExtendedContext,
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
    SyncElasticsearchStepMappingService,
} from "./step-mapping.service"

/**
 * Elasticsearch on-demand sync: `sync-elasticsearch-entity` → `complete` (same control flow as sync-cdn / sync-email-bloom-filter).
 */
@Worker(
    bullData[BullQueueName.SyncElasticsearch].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class SyncElasticsearchWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: SyncElasticsearchStepMappingService,
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
        let payload: SyncElasticsearchPayload | undefined
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
            payload = this.superJson.parse<SyncElasticsearchPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            const context: JobExtendedContext<SyncElasticsearchPayload, EmptyObject> = {
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
                    error: error instanceof Error
                        ? error.message
                        : String(error),
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
