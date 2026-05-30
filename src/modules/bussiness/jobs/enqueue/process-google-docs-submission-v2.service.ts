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

/**
 * Enqueues a SCHEMA V2 Google Docs challenge submission grading job (criteria-based). Mirrors
 * {@link EnqueueProcessGoogleDocsSubmissionJobService} but targets the V2 queue/action and carries
 * the learner's chosen programming language so the grade step picks the right approach criteria.
 */
@Injectable()
export class EnqueueProcessGoogleDocsSubmissionV2JobService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly jobStalledService: JobStalledService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessGoogleDocsSubmissionV2].name)
        private readonly processGoogleDocsSubmissionV2Queue: Queue<string>,
    ) {}

    /**
     * Enqueue a process-google-docs-submission-v2 job.
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
            gradingModel,
            gradingProvider,
            embeddingModel,
            embeddingProvider,
            locale,
            mode,
            lang,
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
                    mode,
                } : {
                }),
                ...(lang !== undefined ? {
                    lang,
                } : {
                }),
            }
            job = await this.jobActionService.createJob(
                {
                    id,
                    userId,
                    actionType: ActionType.ProcessGoogleDocsSubmissionV2,
                    category: JobCategory.SubmitChallenge,
                    maxSteps: envConfig().job.processGitSubmission.maxSteps,
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
        )
        return job
    }
}
