import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnqueueEnrollJobService,
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    enqueueMembershipActiveEmail,
    enqueueSubscriptionActiveEmail,
} from "@modules/transactional-email"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    MembershipService,
} from "@modules/membership"
import {
    envConfig,
} from "@modules/env"
import {
    getStripeWebhookSecret,
} from "@modules/filesystem"
import {
    AiSubscriptionTierNotAvailableException,
    TransactionCourseNotFoundException,
    TransactionExpiredError,
    TransactionNotFoundException,
    UnsupportedTransactionActionException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    InjectStripe,
} from "@modules/stripe"
import {
    Injectable,
    Logger,
} from "@nestjs/common"
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
export class StripeWebhookHandler
    extends ICQRSHandler<StripeWebhookCommand, void>
    implements ICommandHandler<StripeWebhookCommand, void> {
    private readonly logger = new Logger(StripeWebhookHandler.name)

    constructor(
        @InjectStripe()
        private readonly stripe: Stripe,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly membershipService: MembershipService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
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
            this.logger.log(`Ignoring Stripe event type: ${event.type}`)
            return
        }

        // the session echoes our reference id back via client_reference_id
        const session = event.data.object as Stripe.Checkout.Session

        // `checkout.session.completed` can fire for an async payment method whose
        // funds have NOT cleared yet — only a `paid` session means money is in
        if (session.payment_status !== "paid") {
            this.logger.log(
                `Ignoring Stripe session ${session.id}: payment_status=${session.payment_status}`,
            )
            return
        }

        const referenceId = session.client_reference_id
        if (!referenceId) {
            // without our reference id we cannot match a transaction → reject
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
