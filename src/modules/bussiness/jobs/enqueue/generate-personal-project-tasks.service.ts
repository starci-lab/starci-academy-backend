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
    GeneratePersonalProjectTasksPayload,
} from "@modules/bullmq"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic"
import {
    GenerateTaskModelRouterService,
} from "@modules/ai"

/**
 * Params for enqueueing a generate-personal-project-tasks job.
 */
export interface EnqueueGeneratePersonalProjectTasksParams {
    /** Enrollment ID — the user's enrollment to generate tasks for. */
    enrollmentId: string
    /** User ID associated with the job. */
    userId: string
    /** LLM model name override (e.g. "gpt-4o-mini"). */
    model?: string
    /** LLM provider override. */
    provider?: ModelProvider
    /** Locale hint for filtering/prompting. */
    locale?: Locale
}

/**
 * Service for enqueueing generate-personal-project-tasks jobs.
 */
@Injectable()
export class EnqueueGeneratePersonalProjectTasksJobService {
    constructor(
        private readonly generateTaskModelRouterService: GenerateTaskModelRouterService,
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.GeneratePersonalProjectTasks].name)
        private readonly queue: Queue<string>,
    ) { }

    /**
     * Persist a job row and enqueue the payload into BullMQ.
     */
    async enqueue(
        {
            enrollmentId,
            userId,
            model,
            provider,
            locale,
        }: EnqueueGeneratePersonalProjectTasksParams,
    ): Promise<JobEntity> {
        const payload: GeneratePersonalProjectTasksPayload = {
            enrollmentId,
            model: model || this.generateTaskModelRouterService.model,
            provider: provider || this.generateTaskModelRouterService.provider,
            locale,
        }
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.GeneratePersonalProjectTasks,
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
