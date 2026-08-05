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
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    SyncScyllaDBPayload,
} from "@modules/integrations/bullmq/types/payloads/sync-scylladb"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    sleepEnqueueUxDelay,
} from "../utils/enqueue-ux-delay"
import type {
    EnqueueSyncScyllaDBParams,
} from "../types/enqueue"

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
