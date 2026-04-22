import {
    JobActionService,
    JobStalledService,
} from "../atomic"
import {
    Injectable,
} from "@nestjs/common"
import {
    ActionType,
    JobEntity,
} from "@modules/databases"
import {
    InjectSuperJson,
} from "@modules/mixin"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    Queue,
} from "bullmq"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    bullData,
    BullQueueName,
    type ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    EnqueueProcessGitSubmissionJobParams,
} from "../types"
import {
    envConfig,
} from "@modules/env"

/**
 * Service for enqueuing a Git challenge submission grading job.
 */
@Injectable()
export class EnqueueProcessGitSubmissionJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly jobStalledService: JobStalledService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessGitSubmission].name)
        private readonly processGitSubmissionQueue: Queue<string>,
    ) {}

    /**
     * Enqueue a process-git-submission job.
     * @param params - Parameters (see `EnqueueProcessGitSubmissionJobParams`).
     * @returns The persisted job row and queued BullMQ job.
     */
    async enqueue(
        {
            userId,
            userChallengeSubmissionId,
            challengeSubmissionId,
            jobId,
            branch,
            gradingModel,
            gradingProvider,
            embeddingModel,
            embeddingProvider,
        }: EnqueueProcessGitSubmissionJobParams,
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
            const payloadBody: ProcessGitSubmissionPayload = {
                jobId: id,
                userId,
                userChallengeSubmissionId,
                ...(branch !== undefined ? {
                    branch 
                } : {
                }),
                ...(gradingModel !== undefined ? {
                    gradingModel 
                } : {
                }),
                ...(gradingProvider !== undefined ? {
                    gradingProvider 
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
                    actionType: ActionType.ProcessGitSubmission,
                    maxSteps: envConfig().job.processGitSubmission.maxSteps,
                    payload: this.superJson.stringify(payloadBody),
                    challengeSubmissionId,
                },
            )
        }
        await this.processGitSubmissionQueue.add(
            job.id,
            job.payload,
            {
                jobId: job.id,
            },
        )
        return job
    }
}
