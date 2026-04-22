import {
    bullData,
    BullQueueName,
    ProcessCVSubmissionPayload
} from "@modules/bullmq"
import {
    ActionType,
    JobEntity,
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
    EnqueueProcessCvSubmissionJobParams
} from "../types"

/**
 * Service for enqueuing a CV challenge submission grading job.
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
            cvSubmissionAttemptId,
            jobId,
            analyzeModel,
            analyzeProvider,
            embeddingModel,
            embeddingProvider,
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
            const payloadBody: ProcessCVSubmissionPayload = {
                jobId: id,
                userId,
                cvSubmissionId,
                cvSubmissionAttemptId,
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
            }
            job = await this.jobActionService.createJob(
                {
                    id,
                    userId,
                    actionType: ActionType.ProcessCvSubmission,
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
