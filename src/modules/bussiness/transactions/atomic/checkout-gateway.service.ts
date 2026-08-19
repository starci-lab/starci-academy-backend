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
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException,
} from "@modules/platform/exceptions/errors/courses/payos-return-url-and-payos-cancel-url-must-be-required"
import {
    MissingUsdPriceException,
} from "@modules/platform/exceptions/errors/payment/missing-usd-price"
import {
    UnsupportedPaymentTypeException,
} from "@modules/platform/exceptions/errors/payment/unsupported-payment-type"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    InjectPayOS,
} from "@modules/integrations/payos/payos.providers"
import {
    PayOS,
} from "@payos/node"
import {
    InjectSepay,
} from "@modules/integrations/sepay/sepay.providers"
import {
    SePayPgClient,
} from "sepay-pg-node"
import {
    InjectStripe,
} from "@modules/integrations/stripe/stripe.providers"
import type {
    Stripe,
} from "stripe"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import type {
    AcquirePendingTransactionParams,
    BuildSepayCheckoutParams,
    ResolveCheckoutParams,
    ResolveCheckoutResult,
} from "../types/checkout-gateway"
import {
    generateOrderCode,
} from "../utils/order-code"

@Injectable()
/**
 * Shared checkout mechanics for the single-item "open a pending transaction,
 * hand back a provider URL" purchase flows (AI subscription, community
 * membership): the advisory-lock + pending-order reuse scan, and the
 * provider-dispatch switch. Callers own everything about what is being
 * bought and charged -- the reuse scope, the persisted fields, the price --
 * this service only knows how to acquire a lock, look up one row, and talk
 * to a gateway.
 */
export class CheckoutGatewayService {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
        @InjectSepay()
        private readonly sepay: SePayPgClient,
        @InjectStripe()
        private readonly stripe: Stripe,
        private readonly paypalClient: PaypalClient,
        private readonly nowPaymentsClient: NowPaymentsClient,
        private readonly dayjsService: DayjsService,
        private readonly retryService: RetryService,
    ) {}

    /**
     * Acquire the caller's advisory lock, then scan for a pending order
     * matching `where`. Returns the existing row only when it is still
     * reusable (recent enough); otherwise returns `null` so the caller opens
     * a fresh checkout. The lock is always acquired first and always inside
     * the caller's own transaction, so it is held for the rest of that
     * transaction regardless of the scan outcome.
     */
    async acquirePendingTransaction({
        manager,
        lockKey,
        where,
    }: AcquirePendingTransactionParams): Promise<TransactionEntity | null> {
        await manager.query(
            "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
            [lockKey],
        )
        const existing = await manager.findOne(TransactionEntity,
            {
                where,
                order: {
                    createdAt: "DESC"
                },
            })
        if (existing && this.isReusable(existing)) {
            return existing
        }
        return null
    }

    /**
     * Whether a pending transaction is recent enough to hand back instead of
     * creating a new checkout.
     */
    private isReusable(
        transaction: TransactionEntity,
    ): boolean {
        const timeSinceCreationMs = this.dayjsService.now().diff(
            this.dayjsService.from(transaction.createdAt),
            "milliseconds",
        )
        return timeSinceCreationMs < envConfig().services.api.transaction.timeSinceCreationMs
    }

    /**
     * Create a checkout link for the chosen provider.
     *
     * @throws PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException when PayOS URLs are missing
     */
    async resolveCheckout({
        paymentType,
        amount,
        priceUsd,
        orderCode,
        payosReturnUrl,
        payosCancelUrl,
        productLabel,
        exceptionTier,
    }: ResolveCheckoutParams): Promise<ResolveCheckoutResult> {
        switch (paymentType) {
        case PaymentType.PayOS: {
            // PayOS needs explicit redirect URLs
            if (!payosReturnUrl || !payosCancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException({
                    hasPayOsReturnUrl: Boolean(payosReturnUrl),
                    hasPayOsCancelUrl: Boolean(payosCancelUrl),
                })
            }
            const paymentLink = await this.retryService.retry({
                action: async () => this.payos.paymentRequests.create({
                    amount,
                    cancelUrl: payosCancelUrl,
                    description: "EN",
                    orderCode,
                    returnUrl: payosReturnUrl,
                }),
            })
            return {
                checkoutUrl: paymentLink.checkoutUrl,
                amount: paymentLink.amount,
            }
        }
        case PaymentType.Sepay: {
            // SePay PG: sign the order fields; client POSTs them to the checkout URL
            return this.buildSepayCheckout({
                orderCode,
                amount,
                successUrl: payosReturnUrl,
                cancelUrl: payosCancelUrl,
                productLabel,
            })
        }
        case PaymentType.Stripe: {
            // Stripe (redirect): needs explicit success/cancel URLs
            if (!payosReturnUrl || !payosCancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException({
                    hasPayOsReturnUrl: Boolean(payosReturnUrl),
                    hasPayOsCancelUrl: Boolean(payosCancelUrl),
                })
            }
            // never charge VND as USD -- reject when no USD price is configured
            if (!priceUsd || priceUsd <= 0) {
                throw new MissingUsdPriceException({
                    paymentType: PaymentType.Stripe,
                    tier: exceptionTier,
                })
            }
            // configured currency Stripe charges in (e.g. usd)
            const {
                currency,
            } = envConfig().services.api.stripe
            // create the Checkout Session (retried on transient failures)
            const session = await this.retryService.retry({
                action: async () => this.stripe.checkout.sessions.create({
                    mode: "payment",
                    // echo our reference id so the webhook can match the transaction
                    client_reference_id: String(orderCode),
                    success_url: payosReturnUrl,
                    cancel_url: payosCancelUrl,
                    line_items: [
                        {
                            quantity: 1,
                            price_data: {
                                currency,
                                // Stripe expects cents -> convert USD dollars to integer cents
                                unit_amount: Math.round(priceUsd * 100),
                                product_data: {
                                    name: `${productLabel} ${orderCode}`,
                                },
                            },
                        },
                    ],
                }),
            })
            // redirect provider -> no signed form fields; amount stays VND reference
            return {
                checkoutUrl: session.url ?? "",
                amount,
                // store the session id so reconciliation can poll Stripe by id
                providerPaymentId: session.id,
            }
        }
        case PaymentType.Paypal: {
            // PayPal (redirect): needs explicit return/cancel URLs
            if (!payosReturnUrl || !payosCancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException({
                    hasPayOsReturnUrl: Boolean(payosReturnUrl),
                    hasPayOsCancelUrl: Boolean(payosCancelUrl),
                })
            }
            // never charge VND as USD -- reject when no USD price is configured
            if (!priceUsd || priceUsd <= 0) {
                throw new MissingUsdPriceException({
                    paymentType: PaymentType.Paypal,
                    tier: exceptionTier,
                })
            }
            // create the PayPal order (retried on transient failures)
            const order = await this.retryService.retry({
                action: async () => this.paypalClient.createOrder({
                    // PayPal charges USD dollars (client formats to a 2-decimal string)
                    amount: priceUsd,
                    referenceId: String(orderCode),
                    description: `${productLabel} ${orderCode}`,
                    returnUrl: payosReturnUrl,
                    cancelUrl: payosCancelUrl,
                }),
            })
            // redirect provider -> no signed form fields; amount stays VND reference
            return {
                checkoutUrl: order.approveUrl,
                amount,
                // store the PayPal order id so reconciliation can poll by id
                providerPaymentId: order.orderId,
            }
        }
        case PaymentType.Crypto: {
            // NOWPayments (redirect): needs explicit success/cancel URLs
            if (!payosReturnUrl || !payosCancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException({
                    hasPayOsReturnUrl: Boolean(payosReturnUrl),
                    hasPayOsCancelUrl: Boolean(payosCancelUrl),
                })
            }
            // never charge VND as USD -- reject when no USD price is configured
            if (!priceUsd || priceUsd <= 0) {
                throw new MissingUsdPriceException({
                    paymentType: PaymentType.Crypto,
                    tier: exceptionTier,
                })
            }
            // create the hosted crypto invoice (retried on transient failures)
            const invoice = await this.retryService.retry({
                action: async () => this.nowPaymentsClient.createInvoice({
                    // NOWPayments charges USD dollars as price_amount in the price currency
                    amount: priceUsd,
                    referenceId: String(orderCode),
                    description: `${productLabel} ${orderCode}`,
                    successUrl: payosReturnUrl,
                    cancelUrl: payosCancelUrl,
                }),
            })
            // redirect provider -> no signed form fields; amount stays VND reference
            return {
                checkoutUrl: invoice.invoiceUrl,
                amount,
                // store the NOWPayments invoice id so reconciliation can poll by id
                providerPaymentId: invoice.invoiceId,
            }
        }
        default:
            throw new UnsupportedPaymentTypeException({
                paymentType: String(paymentType),
            })
        }
    }

    /**
     * Build a SePay PG one-time-payment checkout: sign the order fields and
     * return the form action URL + the JSON-encoded signed fields. Pure (local
     * HMAC signing) -- safe to call on the transaction-reuse path too.
     */
    buildSepayCheckout({
        orderCode,
        amount,
        successUrl,
        cancelUrl,
        productLabel,
    }: BuildSepayCheckoutParams): ResolveCheckoutResult {
        const fields = this.sepay.checkout.initOneTimePaymentFields({
            operation: "PURCHASE",
            order_invoice_number: String(orderCode),
            order_amount: amount,
            currency: "VND",
            order_description: `${productLabel} ${orderCode}`,
            success_url: successUrl,
            cancel_url: cancelUrl,
            error_url: cancelUrl,
        })
        return {
            checkoutUrl: this.sepay.checkout.initCheckoutUrl(),
            amount,
            checkoutFields: JSON.stringify(fields),
        }
    }

    /**
     * Generate a provider order code (also stored as the transaction reference).
     */
    generateOrderCode(): number {
        return generateOrderCode()
    }
}
