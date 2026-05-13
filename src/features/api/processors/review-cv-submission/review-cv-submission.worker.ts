import {
    BullQueueName,
    bullData,
    ReviewCvSubmissionPayload,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"
import {
    JobActionService,
    JobExtendedContext,
} from "@modules/bussiness"
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
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ReviewCvSubmissionStepMappingService,
} from "./step-mapping.service"
import type {
    ExtendedReviewCvSubmissionContext,
} from "./types"
import {
    UserCVSubmissionEntity,
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    CvSubmissionNotFoundException,
    StepNotFoundException,
} from "@modules/exceptions"

/**
 * Worker: CV submission → extract → plan (LLM) → analyze (LLM) → complete (DB / MinIO).
 */
@Worker(
    bullData[BullQueueName.ProcessCvSubmission].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ReviewCvSubmissionWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: ReviewCvSubmissionStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Process the job.
     * @param bullmqJob - The bullmq job.
     * @returns A promise that resolves when the job is processed.
     */
    async process(bullmqJob: Job<string>) {
        const startedAt = this.dayjsService.now()
        let payload: ReviewCvSubmissionPayload | undefined
        let jobRecord: JobEntity | undefined
        try {
            jobRecord = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                },
            )
            payload = this.superJson.parse<ReviewCvSubmissionPayload>(bullmqJob.data)
            
            const stepMap = this.stepMappingService.getStepMap()
            
            const cvSubmission = await this.entityManager.findOne(
                UserCVSubmissionEntity,
                {
                    where: {
                        id: payload?.cvSubmissionId,
                        status: CvSubmissionStatus.Uploaded,
                    },
                    relations: {
                        user: true,
                    }
                },
            )
            
            if (!cvSubmission) {
                throw new CvSubmissionNotFoundException({
                    cvSubmissionId: payload?.cvSubmissionId,
                })
            }

            const context: JobExtendedContext<
                ReviewCvSubmissionPayload,
            ExtendedReviewCvSubmissionContext
            > = {
                job: jobRecord,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                    cvSubmission,
                    user: cvSubmission.user,
                },
            }

            while (jobRecord.currentStep < jobRecord.maxSteps) {
                // refresh the job record
                const syncedJob = await this.jobActionService.getJob(
                    {
                        id: jobRecord.id,
                    },
                )
                context.job = syncedJob
                jobRecord = syncedJob
                
                // process the step
                const step = stepMap.get(syncedJob.currentStep)
                if (!step) {
                    throw new StepNotFoundException({
                        stepIndex: syncedJob.currentStep,
                    })
                }
                await step.process(context)
            }
            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId: jobRecord.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
        } catch (error) {
            if (jobRecord) {
                await this.jobActionService.failJob({
                    job: jobRecord,
                })
            }
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: jobRecord?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            throw error
        }
    }
}
