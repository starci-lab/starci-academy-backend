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
    GeneratePersonalProjectMilestonesPayload,
} from "@modules/bullmq"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic"
import {
    GenerateMilestoneModelRouterService,
} from "@modules/ai"

/**
 * Params for enqueueing a generate-personal-project-milestones job.
 */
export interface EnqueueGeneratePersonalProjectMilestonesParams {
    /** Enrollment ID — the user's enrollment to generate milestones for. */
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
 * Service for enqueueing generate-personal-project-milestones jobs.
 */
@Injectable()
export class EnqueueGeneratePersonalProjectMilestonesJobService {
    constructor(
        private readonly generateMilestoneModelRouterService: GenerateMilestoneModelRouterService,
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.GeneratePersonalProjectMilestones].name)
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
        }: EnqueueGeneratePersonalProjectMilestonesParams,
    ): Promise<JobEntity> {
        const payload: GeneratePersonalProjectMilestonesPayload = {
            enrollmentId,
            model: model || this.generateMilestoneModelRouterService.model,
            provider: provider || this.generateMilestoneModelRouterService.provider,
            locale,
        }
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.GeneratePersonalProjectMilestones,
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
