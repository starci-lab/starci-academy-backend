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
    JobCategory,
    Locale,
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
import {
    sleepEnqueueUxDelay,
} from "./enqueue-ux-delay"

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
        challengeSubmissionId,
        jobId,
        gradingModel,
        gradingProvider,
        embeddingModel,
        embeddingProvider,
        locale,
        courseId,
        enrollmentId,
        mode,
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
                challengeSubmissionId,
                courseId,
                enrollmentId,
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
                ...(locale !== undefined ? {
                    locale: locale as Locale,
                } : {
                }),
                ...(mode !== undefined ? {
                    mode
                } : {
                }),
            }
            job = await this.jobActionService.createJob(
                {
                    id,
                    userId,
                    actionType: ActionType.ProcessGoogleDocsSubmission,
                    category: JobCategory.SubmitChallenge,
                    maxSteps: envConfig().job.processGitSubmission.maxSteps,
                    payload: this.superJson.stringify(payloadBody),
                    challengeSubmissionId,
                },
            )
        }

        void sleepEnqueueUxDelay().then(() =>
            this.processGoogleDocsSubmissionQueue.add(
                job.id,
                job.payload,
                {
                    jobId: job.id,
                },
            ),
        )

        return job
    }
}

