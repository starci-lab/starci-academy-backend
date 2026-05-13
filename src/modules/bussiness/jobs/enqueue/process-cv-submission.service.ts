import {
    bullData,
    BullQueueName,
    ReviewCvSubmissionPayload,
} from "@modules/bullmq"
import {
    ActionType,
    JobEntity,
    JobCategory,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    Injectable,
} from "@nestjs/common"
import {
    Queue,
} from "bullmq"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
    JobStalledService,
} from "../atomic"
import {
    EnqueueProcessCvSubmissionJobParams,
} from "../types"

/**
 * Service for enqueuing a CV review / extraction pipeline job (`process-cv-submission` queue).
 */
@Injectable()
export class EnqueueProcessCvSubmissionJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly jobStalledService: JobStalledService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessCvSubmission].name)
        private readonly processCvSubmissionQueue: Queue<string>,
    ) {}

    /**
     * Enqueue a process-cv-submission job.
     * @param params - Parameters (see `EnqueueProcessCvSubmissionJobParams`).
     * @returns The persisted job row and queued BullMQ job.
     */
    async enqueue(
        {
            userId,
            cvSubmissionId,
            jobId,
            analyzeModel,
            analyzeProvider,
            embeddingModel,
            embeddingProvider,
            templateCvId,
            locale,
        }: EnqueueProcessCvSubmissionJobParams,
    ): Promise<JobEntity> {

        let job: JobEntity | null = null
        if (jobId) {
            job = await this.jobStalledService.requeueJob(
                {
                    id: jobId,
                },
            )
        } else {
            const id = uuidv4()
            const payloadBody: ReviewCvSubmissionPayload = {
                jobId: id,
                cvSubmissionId,
                ...(analyzeModel !== undefined ? {
                    analyzeModel 
                } : {
                }),
                ...(analyzeProvider !== undefined ? {
                    analyzeProvider 
                } : {
                }),
                ...(embeddingModel !== undefined ? {
                    embeddingModel 
                } : {
                }),
                ...(embeddingProvider !== undefined ? {
                    embeddingProvider 
                } : {
                }),
                ...(templateCvId !== undefined ? {
                    templateCvId 
                } : {
                }),
                ...(locale !== undefined ? {
                    locale 
                } : {
                }),
            }
            job = await this.jobActionService.createJob(
                {
                    id,
                    userId,
                    actionType: ActionType.ProcessCvSubmission,
                    category: JobCategory.ReviewCv,
                    maxSteps: envConfig().job.processCvSubmission.maxSteps,
                    payload: this.superJson.stringify(payloadBody),
                },
            )
        }
        await this.processCvSubmissionQueue.add(
            job.id,
            job.payload,
            {
                jobId: job.id,
            },
        )
        return job
    }
}
