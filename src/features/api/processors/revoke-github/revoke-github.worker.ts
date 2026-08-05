import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    EnqueueRevokeGithubPayload,
} from "@modules/integrations/bullmq/types/payloads/revoke-github"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
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
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    RevokeGithubStepMappingService,
} from "./step-mapping.service"

@Worker(
    bullData[BullQueueName.RevokeGithub].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
/**
 * Revoke GitHub processor: `remove-github`.
 */
export class RevokeGithubWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: RevokeGithubStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    /**
     * Process the revoke-github job.
     */
    async process(
        bullmqJob: Job<string>,
    ): Promise<void> {
        const startedAt = this.dayjsService.now()
        let payload: EnqueueRevokeGithubPayload | undefined
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
                },
            )
            payload = this.superJson.parse<EnqueueRevokeGithubPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            const context: JobExtendedContext<EnqueueRevokeGithubPayload, EmptyObject> = {
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
