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
} from "@modules/bussiness"
import {
    StepNotFoundException,
} from "@modules/exceptions"

@Worker(
    bullData[BullQueueName.Enroll].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    }
)
/**
 * Worker for enrolling a user in a course.
 */
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
            // claim the job (bumps the fencing token, marks it Processing) so a
            // stalled redelivery is fenced out — parity with the other processors
            await this.jobActionService.processingJob(
                {
                    job,
                    emitChangeEvent: false,
                },
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
                extended: undefined,
            }
            // process the steps
            while (job.currentStep < job.maxSteps) {
                // refresh the job record
                const syncedJob = await this.jobActionService.getJob(
                    {
                        id: job.id,
                    },
                )
                job = syncedJob
                context.job = syncedJob
                // guard against a maxSteps/step-map mismatch: a missing step would
                // never advance currentStep → an infinite loop pinning this worker
                const step = stepMap.get(syncedJob.currentStep)
                if (!step) {
                    throw new StepNotFoundException({
                        stepIndex: syncedJob.currentStep,
                    })
                }
                // process the step
                await step.process(
                    {
                        job: syncedJob,
                        queueName: bullmqJob.queueName,
                        payload,
                        extended: undefined,
                    }
                )
            }
            // mark the job complete (parity with the other processors)
            await this.jobActionService.completeJob(
                {
                    job,
                    emitChangeEvent: false,
                },
            )
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