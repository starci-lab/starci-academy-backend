import {
    Injectable,
} from "@nestjs/common"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import type {
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
    type SyncIndexerPayload,
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
} from "./enqueue-ux-delay"

export type EnqueueSyncIndexerParams = SyncIndexerPayload

/**
 * Enqueue a job that scans entities and caches their parent-chain refs.
 */
@Injectable()
export class EnqueueSyncIndexerJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.SyncIndexer].name)
        private readonly syncIndexerQueue: Queue<string>,
    ) {}

    /**
     * Persist a jobs row and push the payload to BullMQ.
     */
    async enqueue(
        params: EnqueueSyncIndexerParams,
    ): Promise<JobEntity> {
        const job = await this.jobActionService.createJob(
            {
                id: uuidv4(),
                actionType: ActionType.SyncIndexer,
                maxSteps: 2,
                payload: this.superJson.stringify(params satisfies SyncIndexerPayload),
            },
        )
        void sleepEnqueueUxDelay().then(() =>
            this.syncIndexerQueue.add(
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

