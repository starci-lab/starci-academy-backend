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
    type SyncCdnPayload,
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
    EnqueueSyncCdnParams,
} from "../types"

/**
 * Enqueue a one-off job: sync a single entity to the CDN (see `CdnSynchronizer` runtime services).
 */
@Injectable()
export class EnqueueSyncCdnJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.SyncCdn].name)
        private readonly syncCdnQueue: Queue<string>,
    ) {}

    /**
     * Persist a jobs row and push the payload to BullMQ.
     */
    async enqueue(
        params: EnqueueSyncCdnParams,
    ): Promise<JobEntity> {
        const job = await this.jobActionService.createJob(
            {
                id: uuidv4(),
                actionType: ActionType.SyncCdn,
                maxSteps: 2,
                payload: this.superJson.stringify(params satisfies SyncCdnPayload),
            },
        )
        void sleepEnqueueUxDelay().then(() =>
            this.syncCdnQueue.add(
                job.id,
                job.payload,
                {
                    jobId: job.id,
                },
            ),
        )
        return job
    }
}
