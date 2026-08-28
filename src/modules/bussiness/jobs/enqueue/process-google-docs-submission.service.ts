import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    JobStalledService,
} from "../atomic/job-stalled.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    JobCategory,
} from "@modules/databases/postgresql/primary/enums/job-category"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
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
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/process-google-docs-submission"
import type {
    EnqueueProcessGoogleDocsSubmissionJobParams,
} from "../types/enqueue"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    sleepEnqueueUxDelay,
} from "../utils/enqueue-ux-delay"

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
        params: EnqueueProcessGoogleDocsSubmissionJobParams,
    ): Promise<JobEntity> {
        const {
            jobId,
            entityManager,
            deferPublish = false,
        } = params
        let job: JobEntity
        if (jobId) {
            job = await this.jobStalledService.requeueJob(
                {
                    id: jobId,
                    ...(entityManager !== undefined ? {
                        entityManager,
                    } : {
                    }),
                },
            )
        } else {
            job = await this.createNewJob(params)
        }
        if (!deferPublish) void this.publish(job).catch(() => undefined)
        return job
    }

    private async createNewJob({
        userId,
        enrollmentId,
        userChallengeSubmissionId,
        challengeSubmissionId,
        reservedJobId,
        attemptId,
        entityManager,
        embeddingModel,
        embeddingProvider,
        locale,
        ai,
    }: EnqueueProcessGoogleDocsSubmissionJobParams): Promise<JobEntity> {
        const id = reservedJobId ?? uuidv4()
        const payloadBody: ProcessGoogleDocsSubmissionPayload = {
            jobId: id,
            ...(attemptId !== undefined ? {
                attemptId,
            } : {
            }),
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
        return this.jobActionService.createJob({
            id,
            userId,
            actionType: ActionType.ProcessGoogleDocsSubmission,
            category: JobCategory.SubmitChallenge,
            maxSteps: envConfig().job.processGoogleDocsSubmission.maxSteps,
            payload: this.superJson.stringify(payloadBody),
            challengeSubmissionId,
            ...(entityManager !== undefined ? {
                entityManager,
            } : {
            }),
            refs: {
                userChallengeSubmissionId,
                enrollmentId,
                ...(attemptId !== undefined ? {
                    challengeAttemptId: attemptId,
                } : {
                }),
            },
        })
    }

    /** Publish a previously persisted job after its owning database transaction commits. */
    async publish(job: JobEntity): Promise<void> {
        try {
            await sleepEnqueueUxDelay()
            const dispatchId = job.fencingToken > 0
                ? `${job.id}-${job.fencingToken}`
                : job.id
            await this.processGoogleDocsSubmissionV2Queue.add(
                job.id,
                job.payload,
                {
                    jobId: dispatchId,
                },
            )
        } catch (error) {
            await this.jobActionService.failJob({
                job,
                error: `Failed to enqueue job to broker: ${error instanceof Error ? error.message : "unknown error"}`,
            })
            throw error
        }
    }
}
