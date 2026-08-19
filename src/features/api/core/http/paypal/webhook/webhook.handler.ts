import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    TransactionGrantService,
} from "@modules/bussiness/transactions/atomic/transaction-grant.service"
import {
    InvalidPaypalWebhookSignatureException,
} from "@modules/platform/exceptions/errors/payment/invalid-paypal-webhook-signature"
import {
    PaypalCaptureNotConfirmedException,
} from "@modules/platform/exceptions/errors/payment/paypal-capture-not-confirmed"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    toUnknownRecord,
} from "@modules/lib/common/utils/unknown-record"
import type {
    PaypalPurchaseUnit,
} from "@modules/integrations/paypal/types/paypal"
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
import {
    PaypalWebhookCommand,
} from "./webhook.command"

@CommandHandler(PaypalWebhookCommand)
@Injectable()
/**
 * Verifies the event via PayPal's signature API then settles -- a failed verify means the
 * payload is forged and must not enroll.
 */
export class PaypalWebhookHandler
    extends ICQRSHandler<PaypalWebhookCommand, void>
    implements ICommandHandler<PaypalWebhookCommand, void> {
    constructor(
        private readonly paypalClient: PaypalClient,
        private readonly transactionGrantService: TransactionGrantService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(
        command: PaypalWebhookCommand,
    ): Promise<void> {
        const transaction = await this.resolvePayableTransaction(command)
        if (!transaction) {
            // an ignorable event (unrelated event type) -- already logged
            return
        }
        await this.transactionGrantService.grantForTransaction(transaction)
    }

    /**
     * Verify the webhook signature, decide whether the event is one worth granting
     * (ignoring unrelated event types), capture the order when needed, and resolve
     * it to the matching, unexpired, still-pending transaction.
     * @param command - The webhook command carrying the body and signature headers.
     * @returns The transaction to grant, or `null` when the event should be silently ignored.
     */
    private async resolvePayableTransaction(
        command: PaypalWebhookCommand,
    ): Promise<TransactionEntity | null> {
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
            webhookEvent: toUnknownRecord(body),
        })
        if (!verified) {
            // a failed verification means the payload is untrusted -> reject
            throw new InvalidPaypalWebhookSignatureException({
                eventId: body.id,
            })
        }

        // two events matter: APPROVED (buyer agreed, funds NOT yet taken) and
        // CAPTURE.COMPLETED (funds already taken). Anything else is ignored.
        if (!this.isRelevantPaypalEvent(body.event_type)) {
            this.winstonService.log(
                WinstonLog.PaymentWebhookIgnored,
                {
                    op: "paypal.webhook.ignored",
                    meta: {
                        eventType: body.event_type,
                        reason: "unsupported event type",
                    },
                },
            )
            return null
        }

        // with intent=CAPTURE, approval alone moves NO money -- capture the funds
        // before granting anything. Idempotent: an already-captured order returns
        // captured=true. If the capture does not complete, we do NOT grant.
        if (body.event_type === "CHECKOUT.ORDER.APPROVED") {
            await this.captureApprovedOrder(body.resource)
        }

        // resolve our reference id: prefer custom_id on the resource, else look up the order
        const referenceId = await this.resolveReferenceId(body.resource)
        if (!referenceId) {
            // without our reference id we cannot match a transaction -> reject
            throw new TransactionNotFoundException({
                referenceId: "missing custom_id",
            })
        }

        // resolve + expiry-check the pending transaction (shared across every
        // gateway webhook once its own event verification has resolved a referenceId)
        return this.transactionGrantService.resolvePendingTransaction(referenceId)
    }

    /** Whether a PayPal event type is one this webhook grants for -- everything else is ignored. */
    private isRelevantPaypalEvent(eventType: string | undefined): boolean {
        return eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED"
    }

    /**
     * Capture an approved order's funds before anything is granted. Idempotent: an
     * already-captured order returns `captured: true`.
     * @param resource - The webhook event's `resource` payload.
     */
    private async captureApprovedOrder(
        resource: Record<string, unknown> | undefined,
    ): Promise<void> {
        const orderId = typeof resource?.id === "string"
            ? resource.id
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
            // funds were not taken -> reject so nothing is granted for free
            throw new PaypalCaptureNotConfirmedException({
                orderId,
                status: capture.status,
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
        // no resource at all -> nothing to resolve
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
