import {
    BullQueueName,
    EnqueueResolveGithubPayload,
    bullData,
} from "@modules/bullmq"
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
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job,
} from "bullmq"
import SuperJSON from "superjson"
import {
    JobActionService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    JobEntity,
} from "@modules/databases"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ResolveGithubStepMappingService,
} from "./step-mapping.service"

/**
 * Resolve GitHub processor: `send-github` -> `update-user` -> `complete`.
 */
@Worker(
    bullData[BullQueueName.ResolveGithub].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ResolveGithubWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: ResolveGithubStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    /**
     * Process the resolve-github job.
     */
    async process(
        bullmqJob: Job<string>,
    ): Promise<void> {
        const startedAt = this.dayjsService.now()
        let payload: EnqueueResolveGithubPayload | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                },
            )
            await this.jobActionService.processingJob(
                {
                    job,
                    emitChangeEvent: false,
                },
            )
            payload = this.superJson.parse<EnqueueResolveGithubPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            const context: JobExtendedContext<EnqueueResolveGithubPayload, EmptyObject> = {
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
                await stepMap.get(
                    syncedJob.currentStep,
                )?.process(
                    context,
                )
            }
            await this.jobActionService.completeJob(
                {
                    job,
                    emitChangeEvent: false,
                },
            )
            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId: job.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(
                        this.dayjsService.from(
                            startedAt,
                        ),
                    ),
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
                    durationMs: this.dayjsService.now().diff(
                        this.dayjsService.from(
                            startedAt,
                        ),
                    ),
                },
            )
            throw error
        }
    }
}

