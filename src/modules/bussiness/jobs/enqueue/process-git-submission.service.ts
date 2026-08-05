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
    ProcessGitSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/process-git-submission"
import {
    EnqueueProcessGitSubmissionJobParams,
} from "../types/enqueue"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    sleepEnqueueUxDelay,
} from "../utils/enqueue-ux-delay"

@Injectable()
/**
 * Enqueues a SCHEMA V2 Git challenge submission grading job (criteria-based): targets the V2
 * queue/action and carries the learner's chosen programming language so the grade step picks the
 * right approach criteria. (The legacy V1 enqueue/pipeline has been removed.)
 */
export class EnqueueProcessGitSubmissionJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly jobStalledService: JobStalledService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessGitSubmission].name)
        private readonly processGitSubmissionV2Queue: Queue<string>,
    ) {}

    /**
     * Enqueue a process-git-submission job.
     * @param params - Parameters (see `EnqueueProcessGitSubmissionJobParams`).
     * @returns The persisted job row and queued BullMQ job.
     */
    async enqueue(
        {
            userId,
            enrollmentId,
            userChallengeSubmissionId,
            challengeSubmissionId,
            jobId,
            branch,
            embeddingModel,
            embeddingProvider,
            locale,
            ai,
            lang,
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
                enrollmentId,
                userChallengeSubmissionId,
                ...(branch !== undefined ? {
                    branch,
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
                ...(ai !== undefined ? {
                    ai,
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
                    actionType: ActionType.ProcessGitSubmission,
                    category: JobCategory.SubmitChallenge,
                    maxSteps: envConfig().job.processGitSubmission.maxSteps,
                    payload: this.superJson.stringify(payloadBody),
                    challengeSubmissionId,
                },
            )
        }
        void sleepEnqueueUxDelay().then(() =>
            this.processGitSubmissionV2Queue.add(
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
