import {
    Injectable,
} from "@nestjs/common"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import SuperJSON from "superjson"
import {
    Queue,
} from "bullmq"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    bullData,
    BullQueueName,
    type ReconcileTransactionPayload,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"
import {
    v4 as uuidv4,
} from "uuid"
import {
    EnqueueReconcileTransactionJobParams,
} from "../types"

/**
 * Enqueues a delayed reconcile-transaction poll. Each enqueue schedules a single
 * BullMQ job fired after `transaction.reconcile.delayMs` (BullMQ-native `delay`,
 * so it survives restarts — unlike an in-process sleep). The worker re-enqueues
 * the next attempt itself, producing the "poll every N minutes" cadence.
 */
@Injectable()
export class EnqueueReconcileTransactionJobService {
    constructor(
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.ReconcileTransaction].name)
        private readonly reconcileQueue: Queue<string>,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Schedule one delayed reconcile poll for a pending transaction.
     *
     * @param params - The transaction id and 1-based attempt number (default 1).
     */
    async enqueue(
        {
            transactionId,
            attempt = 1,
            delayMs: delayMsOverride,
        }: EnqueueReconcileTransactionJobParams,
    ): Promise<void> {
        // serialize the poll payload (transaction id + attempt counter)
        const payload: ReconcileTransactionPayload = {
            transactionId,
            attempt,
        }
        // schedule the job to run after the delay (override wins; else the configured delay)
        const delayMs = delayMsOverride ?? envConfig().services.api.transaction.reconcile.delayMs
        await this.reconcileQueue.add(
            `reconcile-transaction:${transactionId}:${attempt}`,
            this.superJson.stringify(payload),
            {
                // unique per attempt so re-enqueues are not deduplicated by BullMQ
                jobId: uuidv4(),
                delay: delayMs,
            },
        )
        this.winstonService.log(
            WinstonLog.TransactionReconcileScheduled,
            {
                transactionId,
                attempt,
                delayMs,
            },
        )
    }
}
