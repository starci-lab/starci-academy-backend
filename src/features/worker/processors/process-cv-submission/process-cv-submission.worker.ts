import {
    BullQueueName,
    ProcessCVSubmissionPayload,
    bullData,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"
import {
    JobActionService,
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
    ProcessCVSubmissionStepMappingService,
} from "./step-mapping.service"
import type {
    ExtendedProcessCvSubmissionContext,
} from "./types"
import {
    CVSubmissionEntity,
    CvSubmissionStatus,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    JobExtendedContext 
} from "../types"

/**
 * Worker: CV submission → extract (pdf/docx) → analyze (LLM) → done.
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
export class ProcessCvSubmissionWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: ProcessCVSubmissionStepMappingService,
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
        let payload: ProcessCVSubmissionPayload | undefined
        let jobRecord: JobEntity | undefined
        try {
            jobRecord = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                },
            )
            payload = this.superJson.parse<ProcessCVSubmissionPayload>(bullmqJob.data)
            
            const stepMap = this.stepMappingService.getStepMap()
            
            const cvSubmission = await this.entityManager.findOne(
                CVSubmissionEntity,
                {
                    where: {
                        id: payload.cvSubmissionId,
                    },
                    relations: [
                        "user",
                        "cvPrompt",
                    ],
                },
            )

            if (!cvSubmission) {
                throw new Error(`CV Submission ${payload.cvSubmissionId} not found.`)
            }

            // Mark processing early so API/DB reflects worker progress.
            if (cvSubmission.status === CvSubmissionStatus.Pending) {
                cvSubmission.status = CvSubmissionStatus.Processing
                await this.entityManager.update(
                    CVSubmissionEntity,
                    cvSubmission.id,
                    {
                        status: CvSubmissionStatus.Processing,
                    },
                )
            }

            const context: JobExtendedContext<
            ProcessCVSubmissionPayload,
            ExtendedProcessCvSubmissionContext
            > = {
                job: jobRecord,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                    cvSubmission,
                    user: cvSubmission.user,
                    cvPrompt: cvSubmission.cvPrompt!,
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
                    throw new Error(`Step ${syncedJob.currentStep} not found for ProcessCvSubmission pipeline.`)
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

            if (payload?.cvSubmissionId) {
                await this.entityManager.update(
                    CVSubmissionEntity,
                    payload.cvSubmissionId,
                    {
                        status: CvSubmissionStatus.Failed,
                    },
                )
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
