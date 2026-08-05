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
} from "../utils"

@Injectable()
/**
 * Enqueues a SCHEMA V2 Google Docs challenge submission grading job (criteria-based): targets the
 * V2 queue/action and carries the learner's chosen programming language so the grade step picks the
 * right approach criteria. (The legacy V1 enqueue/pipeline has been removed.)
 */
export class EnqueueProcessGoogleDocsSubmissionJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly jobStalledService: JobStalledService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessGoogleDocsSubmission].name)
        private readonly processGoogleDocsSubmissionV2Queue: Queue<string>,
    ) {}

    /**
     * Enqueue a process-google-docs-submission job.
     * @param params - Parameters (see `EnqueueProcessGoogleDocsSubmissionJobParams`).
     * @returns The persisted job row and queued BullMQ job.
     */
    async enqueue(
        {
            userId,
            enrollmentId,
            userChallengeSubmissionId,
            challengeSubmissionId,
            jobId,
            embeddingModel,
            embeddingProvider,
            locale,
            ai,
        }: EnqueueProcessGoogleDocsSubmissionJobParams,
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
            const payloadBody: ProcessGoogleDocsSubmissionPayload = {
                jobId: id,
                enrollmentId,
                userChallengeSubmissionId,
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
                ...(ai !== undefined ? {
                    ai,
                } : {
                }),
            }
            job = await this.jobActionService.createJob(
                {
                    id,
                    userId,
                    actionType: ActionType.ProcessGoogleDocsSubmission,
                    category: JobCategory.SubmitChallenge,
                    maxSteps: envConfig().job.processGoogleDocsSubmission.maxSteps,
                    payload: this.superJson.stringify(payloadBody),
                    challengeSubmissionId,
                },
            )
        }
        void sleepEnqueueUxDelay().then(() =>
            this.processGoogleDocsSubmissionV2Queue.add(
                job.id,
                job.payload,
                {
                    jobId: job.id,
                },
            ),
        ).catch((error) =>
            this.jobActionService.failJob({
                job,
                error: `Failed to enqueue job to broker: ${error?.message ?? "unknown error"}`,
            }),
        )
        return job
    }
}
