import {
    BullQueueName,
    EnrollPayload,
    bullData 
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager 
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
import { 
    JobActionService, 
    JobCommonService 
} from "@modules/bussiness/jobs"
import {
    InjectSuperJson 
} from "@modules/mixin"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job 
} from "bullmq"
import SuperJSON from "superjson"
import {
    EntityManager 
} from "typeorm"
import {
    EnrollCreateRelationStepService,
} from "./execute-step.service"
import {
    EnrollFindExistingStepService,
} from "./enroll-find-existing-step.service"

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
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,    
        private readonly jobActionService: JobActionService,
        private readonly jobCommonService: JobCommonService,
        private readonly enrollFindExistingStepService: EnrollFindExistingStepService,
        private readonly enrollCreateRelationStepService: EnrollCreateRelationStepService,
    ) {
        super()
    }
    /**
     * Process the action job.
     * @param bullmqJob - The BullMQ job.
     * @returns A promise that resolves when the job is processed.
     */
    async process(bullmqJob: Job<string>) {
        // get the payload from the job
        const payload = this.superJson.parse<EnrollPayload>(bullmqJob.data)
        // get the job record
        const jobRecord = await this.jobCommonService.getJobOrThrow({
            id: payload.jobId,
        })
        try {
            const existed = await this.enrollFindExistingStepService.execute({
                userId: payload.userId,
                courseId: payload.courseId,
                entityManager: this.entityManager,
            })
            await this.jobActionService.increaseJob({
                id: jobRecord.id,
            })
            // if the enrollment already exists, log and return
            if (existed) {
                this.winstonService.log(
                    WinstonLog.EnrollmentAlreadyExists,
                    {
                        userId: payload.userId,
                        courseId: payload.courseId,
                    },
                )
                await this.jobActionService.completeJob({
                    id: jobRecord.id,
                })
            } else {
                await this.enrollCreateRelationStepService.execute({
                    userId: payload.userId,
                    courseId: payload.courseId,
                    entityManager: this.entityManager,
                })
                // log the enrollment
                this.winstonService.log(
                    WinstonLog.EnrollmentCreated,
                    {
                        userId: payload.userId,
                        courseId: payload.courseId,
                    },
                )
                await this.jobActionService.increaseJob({
                    id: jobRecord.id,
                })
            }
        } catch (error) {
            await this.jobActionService.failJob({
                id: jobRecord.id,
                error: error instanceof Error ? error.message : "Unknown error",
            })
            throw error
        }
    }
}