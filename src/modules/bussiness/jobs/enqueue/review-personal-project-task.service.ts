import {
    Injectable,
} from "@nestjs/common"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    Queue,
} from "bullmq"
import {
    ActionType,
    JobEntity,
    Locale,
    ModelProvider,
} from "@modules/databases"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    bullData,
    BullQueueName,
} from "@modules/bullmq"
import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/bullmq"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic"
import {
    ReviewPersonalProjectModelRouterService,
} from "@modules/ai"

/**
 * Params for enqueueing a review-personal-project-task job.
 */
export interface EnqueueReviewPersonalProjectTaskParams {
    /** Enrollment ID. */
    enrollmentId: string
    /** GitHub URL submitted for review. */
    githubUrl: string
    /** Milestone task ID to review. */
    milestoneTaskId: string
    /** Branch to grade (defaults to "main"). */
    branch?: string
    /** User ID associated with the job. */
    userId: string
    /** LLM model name override. */
    model?: string
    /** LLM provider override. */
    provider?: ModelProvider
    /** Locale hint for filtering/prompting. */
    locale?: Locale
}

/**
 * Service for enqueueing review-personal-project-task jobs.
 */
@Injectable()
export class EnqueueReviewPersonalProjectTaskJobService {
    constructor(
        private readonly reviewPersonalProjectModelRouterService: ReviewPersonalProjectModelRouterService,
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ReviewPersonalProjectTask].name)
        private readonly queue: Queue<string>,
    ) { }

    /**
     * Persist a job row and enqueue the payload into BullMQ.
     */
    async enqueue(
        {
            enrollmentId,
            githubUrl,
            milestoneTaskId,
            branch,
            userId,
            model,
            provider,
            locale,
        }: EnqueueReviewPersonalProjectTaskParams,
    ): Promise<JobEntity> {
        const payload: ReviewPersonalProjectTaskPayload = {
            enrollmentId,
            githubUrl,
            milestoneTaskId,
            branch: branch ?? "main",
            gradingModel: model || this.reviewPersonalProjectModelRouterService.model,
            gradingProvider: provider || this.reviewPersonalProjectModelRouterService.provider,
            locale,
        }
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.ReviewPersonalProjectTask,
            maxSteps: 2,
            payload: this.superJson.stringify(payload),
        })
        await this.queue.add(
            job.id,
            job.payload,
            {
                jobId: job.id,
            },
        )
        return job
    }
}
