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
    EnqueueSendMailJobService,
    InstallmentPlanService,
    TransactionActionService,
    TransactionReconcileQueryService,
    VoucherService,
} from "@modules/bussiness"
import {
    enqueueMembershipActiveEmail,
    enqueuePaymentFailedEmail,
    enqueueSubscriptionActiveEmail,
} from "@modules/transactional-email"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    MembershipService,
} from "@modules/membership"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    PaymentType,
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
 * - `paid` -> run the same finalize path as the webhook (grant tier / enqueue enroll).
 * - `unpaid` (gateway terminal non-paid) -> mark the transaction `unpaid`.
 * - `unknown` -> re-enqueue the next attempt; once attempts are exhausted, mark `unpaid`.
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
        // gone or already finalized by the webhook -> nothing to do (idempotent)
        if (!transaction || transaction.status !== TransactionStatus.Pending) {
            return
        }
        // ask the gateway whether it was paid
        const status = await this.transactionReconcileQueryService.resolve(transaction)
        const maxAttempts = envConfig().services.api.transaction.reconcile.maxAttempts
        const exhausted = attempt >= maxAttempts
        // crypto settles slowly and may clear AFTER the poll budget -- never mark it
        // unpaid from here, or a late IPN (which only matches a PENDING row) could
        // never grant. Leave it pending and let the webhook finalize it.
        const isCrypto = transaction.paymentType === PaymentType.Crypto
        // decide the action: paid -> finalize; gateway-terminal unpaid -> mark unpaid;
        // still unknown -> retry while attempts remain, else give up (stop for crypto)
        const decision = status === "paid"
            ? "finalize"
            : status === "unpaid"
                ? "unpaid"
                : !exhausted
                    ? "reenqueue"
                    : isCrypto
                        ? "stop"
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
            // still pending and attempts remain -> schedule the next poll
            await this.enqueueReconcileTransactionJobService.enqueue({
                transactionId,
                attempt: attempt + 1,
            })
            return
        }
        if (decision === "stop") {
            // crypto budget exhausted with no confirmation -> stop polling but keep
            // the row pending so a late IPN can still finalize it
            return
        }
        // gateway terminal non-paid, or all polls exhausted -> mark unpaid, but ONLY
        // if still pending so a webhook that just succeeded is never clobbered
        await this.transactionActionService.updateTransactionStatusIfExpected({
            id: transactionId,
            status: TransactionStatus.Unpaid,
            expectedStatus: TransactionStatus.Pending,
        })
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
