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
import {
    JobEntity,
} from "@modules/databases"
import type {
    JobExtendedContext,
} from "../types"

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
        let job: JobEntity | undefined
        try {   
            job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                }
            )
            // get the payload from the job
            payload = this.superJson.parse<EnrollPayload>(bullmqJob.data)
            // get the step map
            const stepMap = this.stepMappingService.getStepMap()
            const context: JobExtendedContext<
            EnrollPayload, 
            undefined
            > = {
                job,
                queueName: bullmqJob.queueName,
                payload,
            }
            // process the steps
            while (job.currentStep < job.maxSteps) {
                // refresh the job record
                const syncedJob = await this.jobActionService.getJob(
                    {
                        id: job.id,
                    },
                )
                context.job = syncedJob
                // process the step
                await stepMap.get(syncedJob.currentStep)?.process(
                    {
                        job: syncedJob,
                        queueName: bullmqJob.queueName,
                        payload,
                    }
                )
            }
            // log the job executed
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
            // log the job executed
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