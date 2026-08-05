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
    SyncScyllaDBPayload,
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
    EnqueueSyncScyllaDBParams,
} from "../types"

@Injectable()
/**
 * Service for enqueuing a one-off sync-scylladb job.
 */
export class EnqueueSyncScyllaDBJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.SyncScyllaDB].name)
        private readonly syncScyllaDBQueue: Queue<string>,
    ) {}

    /**
     * Persist a jobs row and enqueue the sync payload into BullMQ.
     */
    async enqueue(
        params: EnqueueSyncScyllaDBParams,
    ): Promise<JobEntity> {
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            actionType: ActionType.SyncScyllaDB,
            maxSteps: 1,
            payload: this.superJson.stringify(params satisfies SyncScyllaDBPayload),
        })

        void sleepEnqueueUxDelay().then(() =>
            this.syncScyllaDBQueue.add(
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
