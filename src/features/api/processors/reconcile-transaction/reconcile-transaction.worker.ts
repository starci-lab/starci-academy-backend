import {
    BullQueueName,
    bullData,
    type ReconcileTransactionPayload,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"
import {
    EnqueueEnrollJobService,
    EnqueueReconcileTransactionJobService,
    TransactionActionService,
    TransactionReconcileQueryService,
} from "@modules/bussiness"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job,
} from "bullmq"
import SuperJSON from "superjson"
import type {
    EntityManager,
} from "typeorm"

/**
 * Worker that reconciles a pending payment transaction when no webhook arrived.
 *
 * Fired on a delay by {@link EnqueueReconcileTransactionJobService}. Each run
 * polls the gateway for the transaction's status:
 * - already finalized (not pending) → no-op (idempotent; the webhook won).
 * - `paid` → run the same finalize path as the webhook (grant tier / enqueue enroll).
 * - `unpaid` (gateway terminal non-paid) → mark the transaction `unpaid`.
 * - `unknown` → re-enqueue the next attempt; once attempts are exhausted, mark `unpaid`.
 */
@Worker(
    bullData[BullQueueName.ReconcileTransaction].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ReconcileTransactionWorker extends WorkerHost {
    constructor(
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly transactionReconcileQueryService: TransactionReconcileQueryService,
        private readonly transactionActionService: TransactionActionService,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    /**
     * Process one reconcile poll.
     * @param bullmqJob - The BullMQ job carrying the serialized {@link ReconcileTransactionPayload}.
     */
    async process(bullmqJob: Job<string>): Promise<void> {
        // parse the poll payload (transaction id + attempt counter)
        const {
            transactionId,
            attempt,
        } = this.superJson.parse<ReconcileTransactionPayload>(bullmqJob.data)
        // load the transaction
        const transaction = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    id: transactionId,
                },
            },
        )
        // gone or already finalized by the webhook → nothing to do (idempotent)
        if (!transaction || transaction.status !== TransactionStatus.Pending) {
            return
        }
        // ask the gateway whether it was paid
        const status = await this.transactionReconcileQueryService.resolve(transaction)
        const maxAttempts = envConfig().services.api.transaction.reconcile.maxAttempts
        // decide the action: paid → finalize; unpaid → mark unpaid; unknown → retry or give up
        const decision = status === "paid"
            ? "finalize"
            : status === "unpaid"
                ? "unpaid"
                : attempt < maxAttempts
                    ? "reenqueue"
                    : "unpaid"
        // observable trace of every poll (gateway status + chosen action)
        this.winstonService.log(
            WinstonLog.TransactionReconcilePolled,
            {
                transactionId,
                attempt,
                maxAttempts,
                status,
                decision,
            },
        )
        if (decision === "finalize") {
            // mirror the webhook success path (grant tier / enqueue enroll)
            await this.finalize(transaction)
            return
        }
        if (decision === "reenqueue") {
            // still pending and attempts remain → schedule the next poll
            await this.enqueueReconcileTransactionJobService.enqueue({
                transactionId,
                attempt: attempt + 1,
            })
            return
        }
        // gateway terminal non-paid, or all polls exhausted with no payment → mark unpaid
        await this.transactionActionService.updateTransactionStatus({
            id: transactionId,
            status: TransactionStatus.Unpaid,
        })
    }

    /**
     * Finalize a paid transaction exactly like the gateway webhook does.
     * @param transaction - The paid transaction.
     */
    private async finalize(
        transaction: TransactionEntity,
    ): Promise<void> {
        switch (transaction.actionType) {
        // AI subscription purchase: grant the tier directly (also marks tx succeeded)
        case ActionType.AiSubscriptionPurchase: {
            if (!transaction.aiSubTier) {
                return
            }
            await this.aiEntitlementService.grantTier({
                userId: transaction.userId,
                tier: transaction.aiSubTier,
                transactionId: transaction.id,
            })
            return
        }
        // course enrollment: hand off to the enroll worker (marks tx succeeded)
        case ActionType.Enroll: {
            if (!transaction.courseId) {
                return
            }
            await this.enqueueEnrollJobService.enqueue({
                userId: transaction.userId,
                courseId: transaction.courseId,
                transactionId: transaction.id,
            })
            return
        }
        default:
            return
        }
    }
}
