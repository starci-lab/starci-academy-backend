import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnqueueEnrollJobService,
    EnqueueSendMailJobService,
    NotificationService,
} from "@modules/bussiness"
import {
    enqueueMembershipActiveEmail,
    enqueueSubscriptionActiveEmail,
} from "@modules/transactional-email"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    NotificationType,
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
    AiSubscriptionTierNotAvailableException,
    InvalidPaypalWebhookSignatureException,
    PaypalCaptureNotConfirmedException,
    TransactionCourseNotFoundException,
    TransactionExpiredError,
    TransactionNotFoundException,
    UnsupportedTransactionActionException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    PaypalClient,
} from "@modules/paypal"
import type {
    PaypalPurchaseUnit,
} from "@modules/paypal"
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    PaypalWebhookCommand,
} from "./webhook.command"

@CommandHandler(PaypalWebhookCommand)
@Injectable()
export class PaypalWebhookHandler
    extends ICQRSHandler<PaypalWebhookCommand, void>
    implements ICommandHandler<PaypalWebhookCommand, void> {
    private readonly logger = new Logger(PaypalWebhookHandler.name)

    constructor(
        private readonly paypalClient: PaypalClient,
        private readonly enqueueEnrollJobService: EnqueueEnrollJobService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly membershipService: MembershipService,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly notificationService: NotificationService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    protected override async process(
        command: PaypalWebhookCommand,
    ): Promise<void> {
        // destructure the body + signature headers from the command
        const {
            body,
            authAlgo,
            certUrl,
            transmissionId,
            transmissionSig,
            transmissionTime,
        } = command.params

        // verify the event came from PayPal (verify-webhook-signature API)
        const verified = await this.paypalClient.verifyWebhookSignature({
            authAlgo,
            certUrl,
            transmissionId,
            transmissionSig,
            transmissionTime,
            // pass the raw event body PayPal signed over
            webhookEvent: body as unknown as Record<string, unknown>,
        })
        if (!verified) {
            // a failed verification means the payload is untrusted → reject
            throw new InvalidPaypalWebhookSignatureException({
                eventId: body.id,
            })
        }

        // two events matter: APPROVED (buyer agreed, funds NOT yet taken) and
        // CAPTURE.COMPLETED (funds already taken). Anything else is ignored.
        const isApproved = body.event_type === "CHECKOUT.ORDER.APPROVED"
        const isCaptured = body.event_type === "PAYMENT.CAPTURE.COMPLETED"
        if (!isApproved && !isCaptured) {
            // ignore unrelated event types
            this.logger.log(`Ignoring PayPal event type: ${String(body.event_type)}`)
            return
        }

        // with intent=CAPTURE, approval alone moves NO money — capture the funds
        // before granting anything. Idempotent: an already-captured order returns
        // captured=true. If the capture does not complete, we do NOT grant.
        if (isApproved) {
            const orderId = typeof body.resource?.id === "string"
                ? body.resource.id
                : undefined
            if (!orderId) {
                throw new TransactionNotFoundException({
                    referenceId: "missing PayPal order id",
                })
            }
            const capture = await this.paypalClient.captureOrder({
                orderId,
            })
            if (!capture.captured) {
                // funds were not taken → reject so nothing is granted for free
                throw new PaypalCaptureNotConfirmedException({
                    orderId,
                    status: capture.status,
                })
            }
        }

        // resolve our reference id: prefer custom_id on the resource, else look up the order
        const referenceId = await this.resolveReferenceId(body.resource)
        if (!referenceId) {
            // without our reference id we cannot match a transaction → reject
            throw new TransactionNotFoundException({
                referenceId: "missing custom_id",
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
                    this.logger.error(
                        `Failed to create subscription-granted notification for user ${transaction.userId}: ${String(error)}`,
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

    /**
     * Extract our reference id (the order's `custom_id`) from the webhook
     * resource. For capture events the `custom_id` is at the top level; for
     * order events it sits under `purchase_units[]`. Falls back to the
     * order-detail API lookup when the resource omits it.
     *
     * @param resource - The webhook event `resource` payload
     * @returns The matched reference id, or undefined when unresolved
     */
    private async resolveReferenceId(
        resource?: Record<string, unknown>,
    ): Promise<string | undefined> {
        // no resource at all → nothing to resolve
        if (!resource) {
            return undefined
        }
        // capture events expose custom_id directly on the resource
        const directCustomId = resource.custom_id
        if (typeof directCustomId === "string") {
            return directCustomId
        }
        // order events nest custom_id under the first purchase unit
        const purchaseUnits = resource.purchase_units as Array<PaypalPurchaseUnit> | undefined
        const nestedCustomId = purchaseUnits?.[0]?.custom_id
        if (typeof nestedCustomId === "string") {
            return nestedCustomId
        }
        // last resort: look up the order by id to recover the custom_id
        const orderId = resource.id
        if (typeof orderId === "string") {
            const detail = await this.paypalClient.retrieveOrder({
                orderId,
            })
            return detail.referenceId
        }
        // unresolved
        return undefined
    }
}
