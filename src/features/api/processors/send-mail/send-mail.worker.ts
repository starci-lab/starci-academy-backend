import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    envConfig,
} from "@modules/platform/env/config"
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
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import SuperJSON from "superjson"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    SendMailPayload,
} from "@modules/integrations/bullmq/types/payloads/send-mail"
import {
    SendMailStepMappingService,
} from "./step-mapping.service"

@Worker(
    bullData[BullQueueName.SendMail].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
/**
 * Send mail: `send-mail` -> `complete`.
 */
export class SendMailWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: SendMailStepMappingService,
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
        let payload: SendMailPayload | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                }
            )
            await this.jobActionService.processingJob(
                {
                    job,
                    emitChangeEvent: false,
                }
            )
            payload = this.superJson.parse<SendMailPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            const context: JobExtendedContext<SendMailPayload, EmptyObject> = {
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
                    job,
                    emitChangeEvent: false,
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
            const message = error instanceof Error ? error.message : String(error)
            const configuredAttempts = bullmqJob.opts.attempts ?? 1
            if (job && bullmqJob.attemptsMade + 1 >= configuredAttempts) {
                await this.jobActionService.failJob({
                    job,
                    error: message,
                    emitChangeEvent: false,
                })
            }
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: job?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    error: message,
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
