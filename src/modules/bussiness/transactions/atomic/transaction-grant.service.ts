import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import type {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    ProSubscriptionService,
} from "../../pro-subscription/pro-subscription.service"
import {
    EnqueueEnrollJobService,
} from "../../jobs/enqueue/enroll.service"
import {
    EnqueueSendMailJobService,
} from "../../jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "../../notification/notification.service"
import {
    enqueueMembershipActiveEmail,
    enqueueSubscriptionActiveEmail,
} from "@modules/integrations/transactional-email/grant-emails"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    AiSubscriptionTierNotAvailableException,
} from "@modules/platform/exceptions/errors/ai/ai-subscription-tier-not-available"
import {
    UnsupportedTransactionActionException,
} from "@modules/platform/exceptions/errors/payment/unsupported-transaction-action"
import {
    TransactionCourseNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-course-not-found"
import {
    TransactionExpiredException,
} from "@modules/platform/exceptions/errors/transaction/transaction-expired"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    Injectable,
    Optional,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    EntityManager,
} from "typeorm"

@Injectable()
/**
 * Post-verification settlement shared by every payment-gateway webhook
 * handler (Stripe, PayPal, NOWPayments). Each gateway verifies its own
 * signature/callback and decides which of its own events are worth granting
 * -- once a gateway hands this service the resolved `referenceId`, resolving
 * the pending transaction and granting it are identical regardless of which
 * gateway called, so that part lives here instead of being copy-pasted per
 * gateway. Signature verification itself stays in each gateway's own handler
 * and MUST NOT move here.
 */
export class TransactionGrantService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly membershipService: MembershipService,
        @Optional()
        private readonly proSubscriptionService: ProSubscriptionService | undefined,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly notificationService: NotificationService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Locate the matching pending transaction for a gateway-verified reference
     * id and reject a stale callback that arrives after the reuse/expiry
     * window.
     * @param referenceId - The gateway-resolved reference id (our transaction's `referenceId`).
     * @returns The matched, unexpired, still-pending transaction.
     * @throws TransactionNotFoundException when no pending transaction matches.
     * @throws TransactionExpiredException when the match is past the reuse/expiry window.
     */
    async resolvePendingTransaction(
        referenceId: string,
    ): Promise<TransactionEntity> {
        // locate the matching pending transaction
        const transaction = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    referenceId,
                    status: TransactionStatus.Pending,
                },
            },
        )
        if (!transaction) {
            throw new TransactionNotFoundException({
                referenceId,
            })
        }
        this.assertTransactionNotExpired(transaction)
        return transaction
    }

    /** Reject stale callbacks that arrive after the reuse/expiry window. */
    private assertTransactionNotExpired(
        transaction: TransactionEntity,
    ): void {
        const timeSinceCreationMs = this.dayjsService.now().diff(
            this.dayjsService.from(transaction.createdAt),
            "milliseconds",
        )
        if (timeSinceCreationMs > envConfig().services.api.transaction.timeSinceCreationMs) {
            throw new TransactionExpiredException({
                id: transaction.id,
            })
        }
    }

    /**
     * Grant by action type (identical across every gateway webhook).
     * @param transaction - The verified, payable, pending transaction.
     */
    async grantForTransaction(
        transaction: TransactionEntity,
    ): Promise<void> {
        switch (transaction.actionType) {
        // AI subscription purchase: grant the tier directly (no worker needed)
        case ActionType.AiSubscriptionPurchase:
            await this.grantAiSubscription(transaction)
            return
        // community membership purchase: grant/extend directly
        case ActionType.MembershipPurchase:
            await this.grantCommunityMembership(transaction)
            return
        case ActionType.ProSubscriptionPurchase:
            if (!this.proSubscriptionService) {
                throw new UnsupportedTransactionActionException({
                    actionType: String(transaction.actionType),
                })
            }
            await this.proSubscriptionService.grantPaidPeriod({
                userId: transaction.userId,
                transactionId: transaction.id,
                offerRevision: transaction.offerRevision ?? "unknown",
            })
            return
        case ActionType.Enroll:
            await this.grantEnrollment(transaction)
            return
        default:
            throw new UnsupportedTransactionActionException({
                actionType: String(transaction.actionType),
            })
        }
    }

    /** Grant an AI subscription tier and notify the buyer (email + in-app, best-effort). */
    private async grantAiSubscription(
        transaction: TransactionEntity,
    ): Promise<void> {
        if (!transaction.aiSubTier) {
            throw new AiSubscriptionTierNotAvailableException({
                tier: "unknown",
            })
        }
        const subscriptionGranted = await this.aiEntitlementService.grantTier({
            userId: transaction.userId,
            tier: transaction.aiSubTier,
            transactionId: transaction.id,
        })
        if (!subscriptionGranted) {
            return
        }
        await enqueueSubscriptionActiveEmail({
            entityManager: this.entityManager,
            enqueueSendMailJobService: this.enqueueSendMailJobService,
            userId: transaction.userId,
            tier: transaction.aiSubTier,
            webBaseUrl: envConfig().web.baseUrl,
        })
        await this.notifySubscriptionGranted(transaction,
            transaction.aiSubTier)
    }

    /**
     * Best-effort in-app notification for a granted subscription -- a notification
     * failure must never fail a webhook that already granted a paid tier.
     */
    private async notifySubscriptionGranted(
        transaction: TransactionEntity,
        tier: AiSubTier,
    ): Promise<void> {
        try {
            await this.notificationService.createNotification({
                userId: transaction.userId,
                type: NotificationType.SubscriptionGranted,
                title: {
                    key: "notification.subscriptionGranted.title",
                    params: {
                        tier,
                    },
                },
            })
        } catch (error) {
            this.winstonService.log(
                WinstonLog.NotificationCreateFailed,
                {
                    jobId: transaction.id,
                    step: "notification.create",
                    error: error instanceof Error ? error.message : String(error),
                },
            )
        }
    }

    /** Grant/extend a community membership and email the buyer when newly granted. */
    private async grantCommunityMembership(
        transaction: TransactionEntity,
    ): Promise<void> {
        const membershipGranted = await this.membershipService.grantMembership({
            userId: transaction.userId,
            transactionId: transaction.id,
        })
        if (!membershipGranted) {
            return
        }
        await enqueueMembershipActiveEmail({
            entityManager: this.entityManager,
            enqueueSendMailJobService: this.enqueueSendMailJobService,
            userId: transaction.userId,
            webBaseUrl: envConfig().web.baseUrl,
        })
    }

    /**
     * Fan the paid order out to one enroll job per course (single- or multi-course).
     * A malformed Enroll transaction (no items, no course) is surfaced as
     * course-not-found so the gateway re-delivers.
     */
    private async grantEnrollment(
        transaction: TransactionEntity,
    ): Promise<void> {
        const {
            enqueuedCount,
        } = await this.enqueueEnrollJobService.enqueueForTransaction({
            transaction,
        })
        if (enqueuedCount === 0) {
            throw new TransactionCourseNotFoundException({
                id: transaction.id,
            })
        }
    }
}
