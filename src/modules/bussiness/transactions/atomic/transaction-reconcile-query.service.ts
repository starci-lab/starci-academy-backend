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
    TransactionReconcileResult,
} from "../types/transaction"

/** Return a positive finite provider amount when one is available. */
const readAmount = (value: unknown): number | undefined => {
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0 ? amount : undefined
}

@Injectable()
/** Query payment providers and normalize their authoritative settlement state. */
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

    /** Resolve one pending transaction without conflating provider outage with pending. */
    async resolve(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileResult> {
        try {
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
                return {
                    state: "unavailable",
                    reason: "unsupported-provider",
                }
            }
        } catch {
            return {
                state: "unavailable",
                reason: "provider-error",
            }
        }
    }

    private async resolvePayos(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileResult> {
        const info = await this.payos.paymentRequests.get(transaction.referenceId)
        const status = info.status.toUpperCase()
        if (status === "PAID") {
            return {
                state: "paid",
                providerStatus: status,
                reportedAmount: info.amountPaid,
            }
        }
        if (status === "CANCELLED" || status === "EXPIRED") {
            return {
                state: "terminal-unpaid",
                providerStatus: status,
            }
        }
        if (status === "PENDING" || status === "PROCESSING") {
            return {
                state: "pending",
                providerStatus: status,
            }
        }
        return {
            state: "unavailable",
            reason: "invalid-response",
        }
    }

    private async resolveSepay(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileResult> {
        const detail = await this.sepay.order.retrieve(transaction.referenceId)
        const httpBody = ((detail as { data?: unknown })?.data ?? {
        }) as Record<string, unknown>
        const data = (
            (httpBody.data as Record<string, unknown> | undefined) ?? httpBody
        )
        const status = String(data.status ?? data.order_status ?? "").toLowerCase()
        if (
            data.paid === true
            || [
                "paid",
                "success",
                "completed",
                "settled",
                "captured",
                "approved",
            ].includes(status)
        ) {
            return {
                state: "paid",
                providerStatus: status || "paid",
                reportedAmount: readAmount(data.amount ?? data.order_amount),
            }
        }
        if ([
            "cancelled",
            "canceled",
            "expired",
            "failed",
            "voided",
        ].includes(status)) {
            return {
                state: "terminal-unpaid",
                providerStatus: status,
            }
        }
        if ([
            "pending",
            "processing",
            "created",
        ].includes(status)) {
            return {
                state: "pending",
                providerStatus: status,
            }
        }
        return {
            state: "unavailable",
            reason: "invalid-response",
        }
    }

    private async resolveStripe(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileResult> {
        if (!transaction.providerPaymentId) {
            return {
                state: "unavailable",
                reason: "missing-provider-id",
            }
        }
        const session = await this.stripe.checkout.sessions.retrieve(transaction.providerPaymentId)
        if (session.payment_status === "paid") {
            return {
                state: "paid",
                providerStatus: session.status ?? "paid",
            }
        }
        if (session.status === "expired") {
            return {
                state: "terminal-unpaid",
                providerStatus: session.status,
            }
        }
        if (session.status === "open" || session.status === "complete") {
            return {
                state: "pending",
                providerStatus: session.status,
            }
        }
        return {
            state: "unavailable",
            reason: "invalid-response",
        }
    }

    private async resolvePaypal(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileResult> {
        if (!transaction.providerPaymentId) {
            return {
                state: "unavailable",
                reason: "missing-provider-id",
            }
        }
        const order = await this.paypalClient.retrieveOrder({
            orderId: transaction.providerPaymentId,
        })
        const status = String(order.status).toUpperCase()
        if (status === "COMPLETED") {
            return {
                state: "paid",
                providerStatus: status,
            }
        }
        if (status === "APPROVED") {
            const capture = await this.paypalClient.captureOrder({
                orderId: transaction.providerPaymentId,
            })
            return capture.captured
                ? {
                    state: "paid",
                    providerStatus: "COMPLETED",
                }
                : {
                    state: "pending",
                    providerStatus: status,
                }
        }
        if (status === "VOIDED") {
            return {
                state: "terminal-unpaid",
                providerStatus: status,
            }
        }
        if ([
            "CREATED",
            "PAYER_ACTION_REQUIRED",
        ].includes(status)) {
            return {
                state: "pending",
                providerStatus: status,
            }
        }
        return {
            state: "unavailable",
            reason: "invalid-response",
        }
    }

    private async resolveCrypto(
        transaction: TransactionEntity,
    ): Promise<TransactionReconcileResult> {
        if (!transaction.providerPaymentId) {
            return {
                state: "unavailable",
                reason: "missing-provider-id",
            }
        }
        const result = await this.nowPaymentsClient.getInvoiceStatus(transaction.providerPaymentId)
        return result.paid
            ? {
                state: "paid",
                providerStatus: "paid",
            }
            : {
                state: "pending",
                providerStatus: "pending",
            }
    }
}
