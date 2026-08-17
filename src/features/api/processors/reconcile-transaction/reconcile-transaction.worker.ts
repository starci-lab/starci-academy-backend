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
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    TransactionActionService,
} from "@modules/bussiness/transactions/atomic/transaction-action.service"
import {
    TransactionReconcileQueryService,
} from "@modules/bussiness/transactions/atomic/transaction-reconcile-query.service"
import {
    enqueueMembershipActiveEmail,
    enqueuePaymentFailedEmail,
    enqueueSubscriptionActiveEmail,
} from "@modules/integrations/transactional-email/grant-emails"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
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

@Worker(
    bullData[BullQueueName.ReconcileTransaction].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
/**
 * Worker that reconciles a pending payment transaction when no webhook arrived.
 *
 * Fired on a delay by {@link EnqueueReconcileTransactionJobService}. Each run
 * polls the gateway for the transaction's status:
 * - already finalized (not pending) -> no-op (idempotent; the webhook won).
 * - `paid` -> grant through the single action owner below.
 * - `terminal-unpaid` -> guarded transition to `Unpaid`.
 * - `pending` / `unavailable` -> fast retry, then slow retry while DB stays `Pending`.
 */
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
        private readonly membershipService: MembershipService,
        private readonly winstonService: WinstonService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly voucherService: VoucherService,
        private readonly installmentPlanService: InstallmentPlanService,
    ) {
        super()
    }

    /**
     * Process one reconcile poll.
     * @param bullmqJob - The BullMQ job carrying the serialized {@link ReconcileTransactionPayload}.
     */
    async process(bullmqJob: Job<string>): Promise<void> {
        // parse the poll payload (transaction id + attempt counter)
        const payload = this.superJson.parse<ReconcileTransactionPayload>(bullmqJob.data)
        const {
            transactionId,
            attempt,
        } = payload
        const lane = payload.lane ?? "fast"
        // load the transaction
        const transaction = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    id: transactionId,
                },
            },
        )
        // gone or already finalized by the webhook -> nothing to do (idempotent)
        if (!transaction || transaction.status !== TransactionStatus.Pending) {
            return
        }
        // ask the gateway whether it was paid
        const result = await this.transactionReconcileQueryService.resolve(transaction)
        const {
            maxAttempts,
            slowDelayMs,
        } = envConfig().services.api.transaction.reconcile
        const exhausted = attempt >= maxAttempts
        const underpaid = result.state === "paid"
            && result.reportedAmount !== undefined
            && result.reportedAmount < transaction.amount
        const decision = result.state === "paid" && !underpaid
            ? "finalize"
            : result.state === "terminal-unpaid"
                ? "unpaid"
                : lane === "fast" && !exhausted
                    ? "fast-retry"
                    : underpaid
                        ? "slow-underpaid"
                        : "slow-retry"
        // observable trace of every poll (gateway status + chosen action)
        this.winstonService.log(
            WinstonLog.TransactionReconcilePolled,
            {
                transactionId,
                attempt,
                maxAttempts,
                status: result.state,
                decision,
            },
        )
        if (decision === "finalize") {
            // mirror the webhook success path (grant tier / enqueue enroll)
            await this.finalize(transaction)
            return
        }
        if (decision === "fast-retry") {
            await this.enqueueReconcileTransactionJobService.enqueue({
                transactionId,
                attempt: attempt + 1,
                lane: "fast",
            })
            return
        }
        if (decision === "slow-retry" || decision === "slow-underpaid") {
            await this.enqueueReconcileTransactionJobService.enqueue({
                transactionId,
                attempt: Math.min(attempt,
                    maxAttempts),
                lane: "slow",
                delayMs: slowDelayMs,
            })
            return
        }
        const transitioned = await this.transactionActionService.updateTransactionStatusIfExpected({
            id: transactionId,
            status: TransactionStatus.Unpaid,
            expectedStatus: TransactionStatus.Pending,
        })
        if (!transitioned) {
            return
        }
        // give back any voucher this failed checkout reserved (no-op if none)
        await this.voucherService.release({
            entityManager: this.entityManager,
            transactionId,
        })
        // we only reach here from a PENDING row (guarded above), so this is the
        // first-and-only unpaid transition -> notify the buyer once.
        await enqueuePaymentFailedEmail({
            entityManager: this.entityManager,
            enqueueSendMailJobService: this.enqueueSendMailJobService,
            userId: transaction.userId,
            webBaseUrl: envConfig().web.baseUrl,
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
            const granted = await this.aiEntitlementService.grantTier({
                userId: transaction.userId,
                tier: transaction.aiSubTier,
                transactionId: transaction.id,
            })
            if (granted) {
                await enqueueSubscriptionActiveEmail({
                    entityManager: this.entityManager,
                    enqueueSendMailJobService: this.enqueueSendMailJobService,
                    userId: transaction.userId,
                    tier: transaction.aiSubTier,
                    webBaseUrl: envConfig().web.baseUrl,
                })
            }
            return
        }
        // community membership purchase: grant/extend directly (also marks tx succeeded)
        case ActionType.MembershipPurchase: {
            const granted = await this.membershipService.grantMembership({
                userId: transaction.userId,
                transactionId: transaction.id,
            })
            if (granted) {
                await enqueueMembershipActiveEmail({
                    entityManager: this.entityManager,
                    enqueueSendMailJobService: this.enqueueSendMailJobService,
                    userId: transaction.userId,
                    webBaseUrl: envConfig().web.baseUrl,
                })
            }
            return
        }
        // course enrollment: hand off to the enroll worker (marks tx succeeded).
        // fans a multi-course order out to one enroll job per line (a malformed
        // Enroll transaction with no items and no course simply enqueues nothing).
        case ActionType.Enroll: {
            await this.enqueueEnrollJobService.enqueueForTransaction({
                transaction,
            })
            return
        }
        // installment cycle payment: advance/top-up the plan (also
        // marks tx succeeded). A transaction of this action type is always
        // created with `installmentPlanId` set (see `PayNextInstallmentHandler`).
        case ActionType.InstallmentPayment: {
            if (!transaction.installmentPlanId) {
                return
            }
            await this.installmentPlanService.applyPaymentForTransaction({
                transactionId: transaction.id,
                planId: transaction.installmentPlanId,
                paidAmountVnd: transaction.amount,
            })
            return
        }
        default:
            return
        }
    }
}
