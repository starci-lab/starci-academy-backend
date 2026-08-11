import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    FilenameProcessData,
} from "@modules/integrations/bullmq/types/payloads/process-video"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    StepNotFoundException,
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    Processor as Worker, WorkerHost
} from "@nestjs/bullmq"
import {
    Job
} from "bullmq"
import SuperJSON from "superjson"
import {
    StepMappingService
} from "./step-mapping.service"

@Worker(
    bullData[BullQueueName.ProcessVideo].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    }
)
/**
 * ProcessVideo Bull consumer. Re-reads `job.currentStep` each loop so a retry
 * resumes mid-pipeline instead of re-downloading and re-encoding from step 0.
 */
export class VideoEncoderWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: StepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    async process(bullmqJob: Job<string>): Promise<void> {
        const startedAt = this.dayjsService.now()
        let payload: FilenameProcessData | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob({
                id: bullmqJob.id ?? ""
            })
            await this.jobActionService.processingJob({
                job,
            })
            payload = this.superJson.parse<FilenameProcessData>(bullmqJob.data)

            const stepMap = this.stepMappingService.getStepMap()
            const context = {
                job,
                queueName: bullmqJob.queueName,
                payload,
            }

            while (true) {
                const syncedJob = await this.jobActionService.getJob({
                    id: job.id
                })
                job = syncedJob
                context.job = syncedJob

                if (syncedJob.currentStep >= syncedJob.maxSteps) {
                    break
                }

                const step = stepMap.get(syncedJob.currentStep)
                if (!step) {
                    throw new StepNotFoundException({
                        stepIndex: syncedJob.currentStep,
                    })
                }

                await step.process({
                    job: syncedJob,
                    queueName: bullmqJob.queueName,
                    payload,
                    extended: undefined
                })
            }

            await this.jobActionService.completeJob({
                job,
            })

            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId: job?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : String(error)
            const maxAttempts = bullmqJob.opts.attempts ?? 1
            const isTerminalAttempt = bullmqJob.attemptsMade + 1 >= maxAttempts
            if (job && isTerminalAttempt) {
                await this.jobActionService.failJob({
                    job,
                    error: errorMessage,
                })
            }
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: job?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    error: errorMessage,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            throw error
        }
    }
}
