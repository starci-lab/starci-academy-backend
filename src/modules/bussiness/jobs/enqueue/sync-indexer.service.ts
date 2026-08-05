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
    SyncIndexerPayload,
} from "@modules/integrations/bullmq/types/payloads/sync-indexer"
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
    EnqueueSyncIndexerParams,
} from "../types/enqueue"

@Injectable()
/**
 * Enqueue a job that scans entities and caches their parent-chain refs.
 */
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
        ).catch((error) =>
            this.jobActionService.failJob({
                job,
                error: `Failed to enqueue job to broker: ${error?.message ?? "unknown error"}`,
            }),
        )
        return job
    }
}

