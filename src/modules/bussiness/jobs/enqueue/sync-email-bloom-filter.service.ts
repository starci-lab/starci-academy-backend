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
import type {
    SyncEmailBloomFilterPayload,
} from "@modules/integrations/bullmq/types/payloads/sync-email-bloom-filter"
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

@Injectable()
/**
 * Enqueue a job that rebuilds the email bloom filter from `users.email` in batches.
 */
export class EnqueueSyncEmailBloomFilterJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.SyncEmailBloomFilter].name)
        private readonly syncEmailBloomFilterQueue: Queue<string>,
    ) {}

    /**
     * Persist a job row and enqueue the payload into BullMQ.
     */
    async enqueue(
        params: SyncEmailBloomFilterPayload,
    ): Promise<JobEntity> {
        const job = await this.jobActionService.createJob({
            id: uuidv4(),
            actionType: ActionType.SyncEmailBloomFilter,
            maxSteps: 3,
            payload: this.superJson.stringify(params satisfies SyncEmailBloomFilterPayload),
        })

        void sleepEnqueueUxDelay().then(() =>
            this.syncEmailBloomFilterQueue.add(
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
