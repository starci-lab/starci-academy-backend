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
    type ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import type {
    EnqueueProcessGoogleDocsSubmissionJobParams,
} from "../types"
import {
    envConfig,
} from "@modules/env"

/**
 * Service for enqueuing a Google Docs challenge submission grading job.
 */
@Injectable()
export class EnqueueProcessGoogleDocsSubmissionJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly jobStalledService: JobStalledService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessGoogleDocsSubmission].name)
        private readonly processGoogleDocsSubmissionQueue: Queue<string>,
    ) {}

    /**
     * Enqueue a process-google-docs-submission job.
     * @returns The persisted job row and queued BullMQ job.
     */
    async enqueue({
        userId,
        userChallengeSubmissionId,
        jobId,
        gradingModel,
        gradingProvider,
        embeddingModel,
        embeddingProvider,
    }: EnqueueProcessGoogleDocsSubmissionJobParams): Promise<JobEntity> {
        let job: JobEntity | null = null
        if (jobId) {
            job = await this.jobStalledService.requeueJob(
                {
                    id: jobId,
                },
            )
        } else {
            const id = uuidv4()
            const payloadBody: ProcessGoogleDocsSubmissionPayload = {
                jobId: id,
                userId,
                userChallengeSubmissionId,
                ...(gradingModel !== undefined ? {
                    gradingModel,
                } : {
                }),
                ...(gradingProvider !== undefined ? {
                    gradingProvider,
                } : {
                }),
                ...(embeddingModel !== undefined ? {
                    embeddingModel,
                } : {
                }),
                ...(embeddingProvider !== undefined ? {
                    embeddingProvider,
                } : {
                }),
            }
            job = await this.jobActionService.createJob(
                {
                    id,
                    actionType: ActionType.ProcessGoogleDocsSubmission,
                    maxSteps: envConfig().job.processGitSubmission.maxSteps,
                    payload: this.superJson.stringify(payloadBody),
                },
            )
        }

        await this.processGoogleDocsSubmissionQueue.add(
            job.id,
            job.payload,
            {
                jobId: job.id,
            },
        )

        return job
    }
}

