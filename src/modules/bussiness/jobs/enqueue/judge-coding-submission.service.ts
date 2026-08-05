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
    JudgeCodingSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/judge-coding-submission"
import {
    EnqueueJudgeCodingSubmissionJobParams,
} from "../types/enqueue"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    sleepEnqueueUxDelay,
} from "../utils/enqueue-ux-delay"

@Injectable()
/**
 * Service for enqueuing a coding-submission judging job. Creates (or requeues)
 * the tracked `jobs` row, then adds the BullMQ job after a short UX delay so
 * the client can render a "judging..." state without a flash.
 */
export class EnqueueJudgeCodingSubmissionJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly jobStalledService: JobStalledService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.JudgeCodingSubmission].name)
        private readonly judgeCodingSubmissionQueue: Queue<string>,
    ) {}

    /**
     * Enqueue a judge-coding-submission job.
     *
     * @param params - see {@link EnqueueJudgeCodingSubmissionJobParams}
     * @returns The persisted job row.
     */
    async enqueue(
        {
            userId,
            codingSubmissionId,
            jobId,
        }: EnqueueJudgeCodingSubmissionJobParams,
    ): Promise<JobEntity> {
        // hold the job row regardless of create-vs-requeue branch
        let job: JobEntity | null = null
        // requeue path: a stalled job is being retried by id
        if (jobId) {
            job = await this.jobStalledService.requeueJob({
                id: jobId,
            })
        } else {
            // fresh submit: mint a stable id shared by the job row and its payload
            const id = uuidv4()
            // payload only needs identifiers -- the worker loads the rest from DB
            const payloadBody: JudgeCodingSubmissionPayload = {
                jobId: id,
                codingSubmissionId,
            }
            // persist the tracked job row (Queued, JudgeCoding category for UI)
            job = await this.jobActionService.createJob({
                id,
                userId,
                actionType: ActionType.JudgeCodingSubmission,
                category: JobCategory.JudgeCoding,
                maxSteps: envConfig().job.judgeCodingSubmission.maxSteps,
                payload: this.superJson.stringify(payloadBody),
            })
        }
        // add the BullMQ job after the UX delay; jobId pins it to our row id
        void sleepEnqueueUxDelay().then(() =>
            this.judgeCodingSubmissionQueue.add(
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
        // return the job row so the caller can surface the jobId to the client
        return job
    }
}
