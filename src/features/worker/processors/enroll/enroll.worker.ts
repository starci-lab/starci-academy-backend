import {
    BullQueueName,
    EnrollPayload,
    bullData 
} from "@modules/bullmq"
import {
    envConfig 
} from "@modules/env"
import { 
    JobActionService, 
} from "@modules/bussiness"
import {
    InjectSuperJson 
} from "@modules/mixin"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job 
} from "bullmq"
import SuperJSON from "superjson"
import {
    StepMappingService 
} from "./step-mapping.service"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
} from "@modules/mixin"

/**
 * Worker for enrolling a user in a course.
 */
@Worker(
    bullData[BullQueueName.Enroll].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    }
)
export class EnrollWorker extends WorkerHost {
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
    /**
     * Process the action job.
     * @param bullmqJob - The BullMQ job.
     * @returns A promise that resolves when the job is processed.
     */
    async process(bullmqJob: Job<string>) {
        const startedAt = this.dayjsService.now()
        let payload: EnrollPayload | undefined
        let jobId = ""
        try {
            // get the payload from the job
            payload = this.superJson.parse<EnrollPayload>(bullmqJob.data)
            // get the step map
            const stepMap = this.stepMappingService.getStepMap()
            // get the job record
            const job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                }
            )
            jobId = job.id ?? ""
            // process the steps
            while (job.currentStep < job.maxSteps) {
                await stepMap.get(job.currentStep)?.process(
                    {
                        job,
                        queueName: bullmqJob.queueName,
                        payload: {
                            userId: payload.userId,
                            courseId: payload.courseId,
                            transactionId: payload.transactionId,
                        },
                    }
                )
            }
            // log the job executed
            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId,
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
        } catch (error) {
            // log the job executed
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: bullmqJob.id ?? "",
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