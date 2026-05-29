import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness"
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
    envConfig,
} from "@modules/env"
import {
    AiSubscriptionTierNotAvailableException,
    TransactionCourseNotFoundException,
    TransactionExpiredError,
    TransactionNotFoundException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    PaypalClient,
} from "@modules/paypal"
import {
    BadRequestException,
    Injectable,
    Logger,
    UnauthorizedException,
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
            throw new UnauthorizedException("Invalid PayPal webhook signature")
        }

        // only the approved/completed events represent a paid order
        if (
            body.event_type !== "CHECKOUT.ORDER.APPROVED"
            && body.event_type !== "PAYMENT.CAPTURE.COMPLETED"
        ) {
            // ignore unrelated event types
            this.logger.log(`Ignoring PayPal event type: ${String(body.event_type)}`)
            return
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
            await this.aiEntitlementService.grantTier({
                userId: transaction.userId,
                tier: transaction.aiSubTier,
                transactionId: transaction.id,
            })
            return
        }
        // course enrollment: hand off to the enroll worker
        case ActionType.Enroll: {
            if (!transaction.courseId) {
                throw new TransactionCourseNotFoundException({
                    id: transaction.id,
                })
            }
            await this.enqueueEnrollJobService.enqueue({
                userId: transaction.userId,
                courseId: transaction.courseId,
                transactionId: transaction.id,
            })
            return
        }
        default:
            throw new BadRequestException(
                `Unsupported transaction action type: ${String(transaction.actionType)}`,
            )
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
        const purchaseUnits = resource.purchase_units as Array<{ custom_id?: string }> | undefined
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
