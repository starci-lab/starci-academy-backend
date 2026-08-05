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
    type SyncElasticsearchPayload,
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
    EnqueueSyncElasticsearchParams,
} from "../types"

@Injectable()
/**
 * Enqueue a one-off job: index a single entity into Elasticsearch (see `ElasticsearchSynchronizer` runtime services).
 */
export class EnqueueSyncElasticsearchJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.SyncElasticsearch].name)
        private readonly syncElasticsearchQueue: Queue<string>,
    ) {}

    /**
     * Persist a jobs row and push the payload to BullMQ.
     */
    async enqueue(
        params: EnqueueSyncElasticsearchParams,
    ): Promise<JobEntity> {
        const job = await this.jobActionService.createJob(
            {
                id: uuidv4(),
                actionType: ActionType.SyncElasticsearch,
                maxSteps: 2,
                payload: this.superJson.stringify(params satisfies SyncElasticsearchPayload),
            },
        )
        void sleepEnqueueUxDelay().then(() =>
            this.syncElasticsearchQueue.add(
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
