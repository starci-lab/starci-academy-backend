import {
    Injectable,
} from "@nestjs/common"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import SuperJSON from "superjson"
import {
    Queue,
} from "bullmq"
import {
    InjectQueue,
} from "@nestjs/bullmq"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    ReconcileTransactionPayload,
} from "@modules/integrations/bullmq/types/payloads/reconcile-transaction"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    v4 as uuidv4,
} from "uuid"
import {
    EnqueueReconcileTransactionJobParams,
} from "../types/enqueue"

@Injectable()
/**
 * Enqueues a delayed reconcile-transaction poll. Each enqueue schedules a single
 * BullMQ job fired after `transaction.reconcile.delayMs` (BullMQ-native `delay`,
 * so it survives restarts -- unlike an in-process sleep). The worker re-enqueues
 * the next attempt itself, producing the "poll every N minutes" cadence.
 */
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
            lane = "fast",
            deduplication,
        }: EnqueueReconcileTransactionJobParams,
    ): Promise<void> {
        // master switch: when reconcile polling is disabled, pending transactions
        // are finalized ONLY by their gateway webhook (no fallback poll scheduled)
        if (!envConfig().services.api.transaction.reconcile.enabled) {
            this.winstonService.log(
                WinstonLog.TransactionReconcileScheduled,
                {
                    transactionId,
                    attempt,
                    decision: "skip",
                },
            )
            return
        }
        // serialize the poll payload (transaction id + attempt counter)
        const payload: ReconcileTransactionPayload = {
            transactionId,
            attempt,
            lane,
        }
        // schedule the job to run after the delay (override wins; else the configured delay)
        const delayMs = delayMsOverride ?? envConfig().services.api.transaction.reconcile.delayMs
        await this.reconcileQueue.add(
            `reconcile-transaction:${transactionId}:${attempt}`,
            this.superJson.stringify(payload),
            {
                // Job ids remain unique so a legitimate later retry is never
                // blocked by a completed job. Only webhook bursts opt into the
                // short-lived BullMQ deduplication key below.
                jobId: uuidv4(),
                delay: delayMs,
                ...(deduplication
                    ? {
                        deduplication: {
                            id: deduplication.id,
                            ttl: deduplication.ttlMs,
                        },
                    }
                    : {
                    }),
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
