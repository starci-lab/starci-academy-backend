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
    sleepEnqueueUxDelay,
} from "../utils"
import type {
    EnqueueGeneratePersonalProjectTasksParams,
} from "../types"

@Injectable()
/**
 * Service for enqueueing generate-personal-project-tasks jobs.
 */
export class EnqueueGeneratePersonalProjectTasksJobService {
    constructor(
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
        // No default model: an absent model/provider means "let the balancer
        // pick", which is health- and cost-aware. Pinning a default here bypassed
        // both — the job would keep naming one model even after it was retired
        // from the catalog or its keys went unhealthy.
        const payload: GeneratePersonalProjectTasksPayload = {
            enrollmentId,
            model,
            provider,
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
