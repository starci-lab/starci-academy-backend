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
    InjectPrimaryPostgreSQLEntityManager,
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
    ProcessPersonalProjectPayload,
} from "@modules/bullmq"
import SuperJSON from "superjson"
import {
    EntityManager,
} from "typeorm"
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
    EnqueueProcessPersonalProjectParams,
} from "../types"

@Injectable()
/**
 * Service for enqueueing personal project grading jobs.
 */
export class EnqueueProcessPersonalProjectJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ProcessPersonalProject].name)
        private readonly queue: Queue<string>,
    ) {}

    /**
     * Persist a job row and enqueue the payload into BullMQ.
     */
    async enqueue(
        {
            attemptId,
            branch,
            userId,
        }: EnqueueProcessPersonalProjectParams,
    ): Promise<JobEntity> {
        const payload: ProcessPersonalProjectPayload = {
            attemptId,
            branch: branch ?? "main",
        }

        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            userId,
            actionType: ActionType.ProcessPersonalProject,
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
