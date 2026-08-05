import {
    Injectable,
} from "@nestjs/common"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    InjectPayOS,
} from "@modules/integrations/payos/payos.providers"
import {
    PayOS,
} from "@payos/node"
import {
    InjectStripe,
} from "@modules/integrations/stripe/stripe.providers"
import type {
    Stripe,
} from "stripe"
import {
    InjectSepay,
} from "@modules/integrations/sepay/sepay.providers"
import {
    SePayPgClient,
} from "sepay-pg-node"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import type {
    TransactionReconcileStatus,
} from "../types/transaction"

@Injectable()
/**
 * Queries the originating payment gateway for the authoritative status of a
 * pending transaction during reconciliation.
 *
 * Returns a normalized {@link TransactionReconcileStatus}: `paid` when the
 * gateway confirms payment, `unpaid` when it reports a terminal non-paid state
 * (cancelled/expired/voided), or `unknown` when still pending or the call
 * cannot determine an answer (errors are swallowed into `unknown` so the
 * reconcile poll keeps retrying rather than failing the job).
 */
export class TransactionReconcileQueryService {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
        @InjectStripe()
        private readonly stripe: Stripe,
        @InjectSepay()
        private readonly sepay: SePayPgClient,
        private readonly paypalClient: PaypalClient,
        private readonly nowPaymentsClient: NowPaymentsClient,
    ) {}

    /**
     * Resolve the gateway-authoritative payment status for a pending transaction.
     *
     * @param transaction - The pending transaction to poll.
     * @returns `paid` | `unpaid` | `unknown`.
     */
    async resolve(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileStatus> {
        try {
            // dispatch to the gateway that created the checkout
            switch (transaction.paymentType) {
            case PaymentType.PayOS:
                return await this.resolvePayos(transaction)
            case PaymentType.Sepay:
                return await this.resolveSepay(transaction)
            case PaymentType.Stripe:
                return await this.resolveStripe(transaction)
            case PaymentType.Paypal:
                return await this.resolvePaypal(transaction)
            case PaymentType.Crypto:
                return await this.resolveCrypto(transaction)
            default:
                // unknown provider -> cannot poll, let the poll loop expire it
                return "unknown"
            }
        } catch {
            // never fail the reconcile job on a gateway error -- keep polling (treat as unknown)
            return "unknown"
        }
    }

    /**
     * PayOS: look up the payment link by orderCode (`referenceId`).
     *
     * @param transaction - The pending PayOS transaction.
     * @returns Normalized reconcile status.
     */
    private async resolvePayos(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileStatus> {
        // PayOS keys the payment link by the numeric orderCode we stored as referenceId
        const info = await this.payos.paymentRequests.get(transaction.referenceId)
        const status = String(info.status).toUpperCase()
        if (status === "PAID") {
            return "paid"
        }
        // PayOS reports a terminal state when the link is cancelled or expired
        if (status === "CANCELLED" || status === "EXPIRED") {
            return "unpaid"
        }
        // PENDING / PROCESSING -> still open, keep polling
        return "unknown"
    }

    /**
     * Sepay: query the order-detail API by invoice number (`referenceId`).
     *
     * @param transaction - The pending Sepay transaction.
     * @returns Normalized reconcile status.
     */
    private async resolveSepay(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileStatus> {
        // server-to-server lookup; the SDK return shape is opaque so read defensively
        const detail = await this.sepay.order.retrieve(transaction.referenceId)
        // SePay wraps the order under `data.data`; unwrap twice (fallback to `data`)
        const httpBody = ((detail as { data?: unknown })?.data ?? {
        }) as Record<string, unknown>
        const data = (
            (httpBody.data as Record<string, unknown> | undefined) ?? httpBody
        )
        // some payloads expose an explicit boolean; trust it when present
        if (data.paid === true) {
            return "paid"
        }
        const status = String(data.status ?? data.order_status ?? "").toLowerCase()
        if (["paid",
            "success",
            "completed",
            "settled",
            "captured",
            "approved"].includes(status)) {
            return "paid"
        }
        if (["cancelled",
            "canceled",
            "expired",
            "failed"].includes(status)) {
            return "unpaid"
        }
        return "unknown"
    }

    /**
     * Stripe: retrieve the Checkout Session by id (`providerPaymentId`).
     *
     * @param transaction - The pending Stripe transaction.
     * @returns Normalized reconcile status.
     */
    private async resolveStripe(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileStatus> {
        // we can only poll Stripe if the session id was stored at checkout creation
        if (!transaction.providerPaymentId) {
            return "unknown"
        }
        const session = await this.stripe.checkout.sessions.retrieve(transaction.providerPaymentId)
        if (session.payment_status === "paid") {
            return "paid"
        }
        // the session can no longer be paid once expired
        if (session.status === "expired") {
            return "unpaid"
        }
        return "unknown"
    }

    /**
     * PayPal: retrieve the order by id (`providerPaymentId`).
     *
     * @param transaction - The pending PayPal transaction.
     * @returns Normalized reconcile status.
     */
    private async resolvePaypal(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileStatus> {
        // we can only poll PayPal if the order id was stored at checkout creation
        if (!transaction.providerPaymentId) {
            return "unknown"
        }
        const order = await this.paypalClient.retrieveOrder({
            orderId: transaction.providerPaymentId,
        })
        const status = String(order.status).toUpperCase()
        // funds already taken
        if (status === "COMPLETED") {
            return "paid"
        }
        // approved but NOT captured -> take the funds now (fallback for a missed
        // webhook); only a completed capture counts as paid
        if (status === "APPROVED") {
            const capture = await this.paypalClient.captureOrder({
                orderId: transaction.providerPaymentId,
            })
            return capture.captured ? "paid" : "unknown"
        }
        if (status === "VOIDED") {
            return "unpaid"
        }
        return "unknown"
    }

    /**
     * Crypto (NOWPayments): poll the invoice's payments (`providerPaymentId`).
     * Crypto settlement is slow, so a not-yet-paid invoice stays `unknown` (it is
     * never marked `unpaid` from here -- only the exhausted poll loop does that).
     *
     * @param transaction - The pending crypto transaction.
     * @returns Normalized reconcile status.
     */
    private async resolveCrypto(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileStatus> {
        // we can only poll NOWPayments if the invoice id was stored at checkout creation
        if (!transaction.providerPaymentId) {
            return "unknown"
        }
        const result = await this.nowPaymentsClient.getInvoiceStatus(transaction.providerPaymentId)
        return result.paid ? "paid" : "unknown"
    }
}
