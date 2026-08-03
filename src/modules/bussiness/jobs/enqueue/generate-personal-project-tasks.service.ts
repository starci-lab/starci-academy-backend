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
    AiTaskKind,
    AiTaskModelService,
} from "@modules/ai"
import {
    sleepEnqueueUxDelay,
} from "../utils"
import type {
    EnqueueGeneratePersonalProjectTasksParams,
} from "../types"

/**
 * Service for enqueueing generate-personal-project-tasks jobs.
 */
@Injectable()
export class EnqueueGeneratePersonalProjectTasksJobService {
    constructor(
        private readonly aiTaskModelService: AiTaskModelService,
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
            model: model || this.aiTaskModelService.primaryChoice(AiTaskKind.GenerateMilestone).model,
            provider: provider || this.aiTaskModelService.primaryChoice(AiTaskKind.GenerateMilestone).provider,
            locale,
        }
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.GeneratePersonalProjectTasks,
            maxSteps: 2,
            payload: this.superJson.stringify(payload),
        })
        void sleepEnqueueUxDelay().then(() =>
            this.queue.add(
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
