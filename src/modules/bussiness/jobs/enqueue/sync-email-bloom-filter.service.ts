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
    type SyncEmailBloomFilterPayload,
} from "@modules/bullmq"
import SuperJSON from "superjson"
import {
    v4 as uuidv4,
} from "uuid"
import {
    JobActionService,
} from "../atomic"

/**
 * Enqueue a job that rebuilds the email bloom filter from `users.email` in batches.
 */
@Injectable()
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

        await this.syncEmailBloomFilterQueue.add(
            job.id,
            job.payload,
            {
                jobId: job.id,
            },
        )

        return job
    }
}
