import {
    BullQueueName,
    FilenameProcessData,
    bullData
} from "@modules/bullmq"
import {
    envConfig 
} from "@modules/env"
import {
    JobActionService 
} from "@modules/bussiness"
import {
    InjectSuperJson, DayjsService 
} from "@modules/mixin"
import {
    WinstonLog, WinstonService 
} from "@modules/winston"
import {
    JobEntity 
} from "@modules/databases"
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

    async process(bullmqJob: Job<string>) {
        const startedAt = this.dayjsService.now()
        let payload: FilenameProcessData | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob({
                id: bullmqJob.id ?? "" 
            })
            payload = this.superJson.parse<FilenameProcessData>(bullmqJob.data)

            const stepMap = this.stepMappingService.getStepMap()
            const context = {
                job,
                queueName: bullmqJob.queueName,
                payload,
            }

            while (job.currentStep < job.maxSteps) {
                const syncedJob = await this.jobActionService.getJob({
                    id: job.id 
                })
                context.job = syncedJob

                await stepMap.get(syncedJob.currentStep)?.process({
                    job: syncedJob,
                    queueName: bullmqJob.queueName,
                    payload,
                })
            }

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
            throw error
        }
    }
}
