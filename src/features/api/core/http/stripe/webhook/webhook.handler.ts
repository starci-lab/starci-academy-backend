import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    enqueueMembershipActiveEmail,
    enqueueSubscriptionActiveEmail,
} from "@modules/integrations/transactional-email/grant-emails"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
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
    envConfig,
} from "@modules/platform/env/config"
import {
    getStripeWebhookSecret,
} from "@modules/filesystem/utils/mount-secrets"
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
    TransactionExpiredError,
} from "@modules/platform/exceptions/errors/transaction/transaction-expired"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    InjectStripe,
} from "@modules/integrations/stripe/stripe.providers"
import {
    Injectable,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import Stripe from "stripe"
import type {
    EntityManager,
} from "typeorm"
import {
    StripeWebhookCommand,
} from "./webhook.command"

@CommandHandler(StripeWebhookCommand)
@Injectable()
/**
 * Constructs the Stripe event with the webhook secret then settles only
 * `checkout.session.completed` -- other types must not enroll or refund here.
 */
export class StripeWebhookHandler
    extends ICQRSHandler<StripeWebhookCommand, void>
    implements ICommandHandler<StripeWebhookCommand, void> {
    constructor(
        @InjectStripe()
        private readonly stripe: Stripe,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly membershipService: MembershipService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly notificationService: NotificationService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        command: StripeWebhookCommand,
    ): Promise<void> {
        // pull the raw body + signature captured by the controller
        const {
            rawBody,
            signature,
        } = command.params
        // the signing secret used to verify the event came from Stripe;
        // read from the mounted secret file (never an env var)
        const webhookSecret = getStripeWebhookSecret().trim()

        // verify + parse the event; a bad signature throws and rejects the call
        const event = this.stripe.webhooks.constructEvent(
            rawBody,
            signature,
            webhookSecret,
        )

        // only a completed Checkout Session means the payment succeeded
        if (event.type !== "checkout.session.completed") {
            // ignore other event types (refunds, disputes, etc. handled elsewhere)
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "stripe.webhook.ignored",
                    meta: {
                        eventType: event.type,
                        reason: "unsupported event type",
                    },
                },
            )
            return
        }

        // the session echoes our reference id back via client_reference_id
        const session = event.data.object as Stripe.Checkout.Session

        // `checkout.session.completed` can fire for an async payment method whose
        // funds have NOT cleared yet -- only a `paid` session means money is in
        if (session.payment_status !== "paid") {
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "stripe.webhook.ignored",
                    referenceId: session.id,
                    meta: {
                        paymentStatus: session.payment_status,
                        reason: "payment not paid",
                    },
                },
            )
            return
        }

        const referenceId = session.client_reference_id
        if (!referenceId) {
            // without our reference id we cannot match a transaction -> reject
            throw new TransactionNotFoundException({
                referenceId: "missing client_reference_id",
            })
        }

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

        // reject stale callbacks that arrive after the reuse/expiry window
        const timeSinceCreationMs = this.dayjsService.now().diff(
            this.dayjsService.from(transaction.createdAt),
            "milliseconds",
        )
        if (timeSinceCreationMs > envConfig().services.api.transaction.timeSinceCreationMs) {
            throw new TransactionExpiredError({
                id: transaction.id,
            })
        }

        // grant by action type (mirrors the PayOS/Sepay webhook grant logic)
        switch (transaction.actionType) {
        // AI subscription purchase: grant the tier directly (no worker needed)
        case ActionType.AiSubscriptionPurchase: {
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
            if (subscriptionGranted) {
                await enqueueSubscriptionActiveEmail({
                    entityManager: this.entityManager,
                    enqueueSendMailJobService: this.enqueueSendMailJobService,
                    userId: transaction.userId,
                    tier: transaction.aiSubTier,
                    webBaseUrl: envConfig().web.baseUrl,
                })
                try {
                    await this.notificationService.createNotification({
                        userId: transaction.userId,
                        type: NotificationType.SubscriptionGranted,
                        title: {
                            key: "notification.subscriptionGranted.title",
                            params: {
                                tier: transaction.aiSubTier,
                            },
                        },
                    })
                } catch (error) {
                    // best-effort: a notification failure must never fail a webhook
                    // that already granted a paid tier
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
            return
        }
        // course enrollment: hand off to the enroll worker
        case ActionType.MembershipPurchase: {
            const membershipGranted = await this.membershipService.grantMembership({
                userId: transaction.userId,
                transactionId: transaction.id,
            })
            if (membershipGranted) {
                await enqueueMembershipActiveEmail({
                    entityManager: this.entityManager,
                    enqueueSendMailJobService: this.enqueueSendMailJobService,
                    userId: transaction.userId,
                    webBaseUrl: envConfig().web.baseUrl,
                })
            }
            return
        }
        case ActionType.Enroll: {
            // fan the paid order out to one enroll job per course (single- or
            // multi-course). a malformed Enroll transaction (no items, no course)
            // is surfaced as course-not-found so the gateway re-delivers.
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
            return
        }
        default:
            throw new UnsupportedTransactionActionException({
                actionType: String(transaction.actionType),
            })
        }
    }
}
