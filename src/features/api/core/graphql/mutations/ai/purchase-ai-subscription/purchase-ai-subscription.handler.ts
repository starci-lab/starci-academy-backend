import {
    randomInt,
} from "crypto"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    AiSubscriptionTierNotAvailableException,
} from "@modules/platform/exceptions/errors/ai/ai-subscription-tier-not-available"
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
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
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
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    PurchaseAiSubscriptionCommand,
} from "./purchase-ai-subscription.command"
import {
    PurchaseAiSubscriptionResponseData,
} from "./graphql-types/response"
import type {
    BuildSepayCheckoutParams,
    ResolveCheckoutParams,
    ResolveCheckoutResult,
} from "./types/checkout"

@CommandHandler(PurchaseAiSubscriptionCommand)
@Injectable()
/**
 * Opens AI-tier checkout: persists a pending transaction, then hands the
 * client a provider URL (or SePay signed form fields). Fulfilment is webhook
 * + reconcile-job -- this handler must not mark the subscription active.
 */
export class PurchaseAiSubscriptionHandler
    extends ICQRSHandler<PurchaseAiSubscriptionCommand, PurchaseAiSubscriptionResponseData>
    implements ICommandHandler<PurchaseAiSubscriptionCommand, PurchaseAiSubscriptionResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectPayOS()
        private readonly payos: PayOS,
        @InjectSepay()
        private readonly sepay: SePayPgClient,
        @InjectStripe()
        private readonly stripe: Stripe,
        private readonly paypalClient: PaypalClient,
        private readonly nowPaymentsClient: NowPaymentsClient,
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly dayjsService: DayjsService,
        private readonly retryService: RetryService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
    ) {
        super()
    }

    protected override async process(
        command: PurchaseAiSubscriptionCommand,
    ): Promise<PurchaseAiSubscriptionResponseData> {
        const {
            request: {
                tier,
                paymentType,
                payosReturnUrl,
                payosCancelUrl,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // resolve the tier price from the live catalog (must be enabled)
        const tierConfig = this.mountFilesystemService
            .appConfig()
            .subscriptions
            .tiers
            .find((candidate) => candidate.tier === tier && candidate.enabled)
        if (!tierConfig) {
            throw new AiSubscriptionTierNotAvailableException({
                tier,
            })
        }
        // domestic gateways (PayOS / Sepay) charge this VND price
        const amount = tierConfig.priceVnd
        // international gateways (Stripe / PayPal / Crypto) charge this USD dollar price
        const priceUsd = tierConfig.priceUsd

        const committed = await this.entityManager.transaction(async (manager) => {
            await manager.query(
                "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
                [`checkout:ai-subscription:${user.id}:${tier}:${paymentType}`],
            )
            const existing = await manager.findOne(TransactionEntity,
                {
                    where: {
                        user: {
                            id: user.id
                        },
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: tier,
                        paymentType,
                        status: TransactionStatus.Pending,
                    },
                    order: {
                        createdAt: "DESC"
                    },
                })
            if (existing && this.isReusable(existing)) {
                const checkoutFields = existing.paymentType === PaymentType.Sepay
                    ? this.buildSepayCheckout({
                        orderCode: Number(existing.referenceId),
                        amount: existing.amount,
                    }).checkoutFields
                    : undefined
                return {
                    transaction: existing, checkoutFields
                }
            }

            const orderCode = this.generateOrderCode()
            const checkout = await this.resolveCheckout({
                paymentType,
                amount,
                priceUsd,
                orderCode,
                payosReturnUrl,
                payosCancelUrl,
                tier,
            })
            const transaction = manager.create(TransactionEntity,
                {
                    user,
                    course: null,
                    referenceId: String(orderCode),
                    amount: checkout.amount,
                    pricingPhase: PricingPhase.Regular,
                    paymentType,
                    checkoutUrl: checkout.checkoutUrl,
                    providerPaymentId: checkout.providerPaymentId ?? null,
                    status: TransactionStatus.Pending,
                    actionType: ActionType.AiSubscriptionPurchase,
                    aiSubTier: tier,
                })
            return {
                transaction: await manager.save(transaction),
                checkoutFields: checkout.checkoutFields,
            }
        })
        const transaction = committed.transaction
        // schedule the delayed reconcile poll (fires if no webhook arrives)
        await this.enqueueReconcileTransactionJobService.enqueue({
            transactionId: transaction.id,
        })

        return {
            checkoutUrl: transaction.checkoutUrl,
            referenceId: transaction.referenceId,
            transactionId: transaction.id,
            amount: transaction.amount,
            checkoutFields: committed.checkoutFields,
        }
    }

    /**
     * Whether a pending transaction is recent enough to hand back instead of
     * creating a new checkout (mirrors course-enroll reuse window).
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
    private async resolveCheckout({
        paymentType,
        amount,
        priceUsd,
        orderCode,
        payosReturnUrl,
        payosCancelUrl,
        tier,
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
                    tier,
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
                                    name: `AI subscription ${orderCode}`,
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
                    tier,
                })
            }
            // create the PayPal order (retried on transient failures)
            const order = await this.retryService.retry({
                action: async () => this.paypalClient.createOrder({
                    // PayPal charges USD dollars (client formats to a 2-decimal string)
                    amount: priceUsd,
                    referenceId: String(orderCode),
                    description: `AI subscription ${orderCode}`,
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
                    tier,
                })
            }
            // create the hosted crypto invoice (retried on transient failures)
            const invoice = await this.retryService.retry({
                action: async () => this.nowPaymentsClient.createInvoice({
                    // NOWPayments charges USD dollars as price_amount in the price currency
                    amount: priceUsd,
                    referenceId: String(orderCode),
                    description: `AI subscription ${orderCode}`,
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
    private buildSepayCheckout({
        orderCode,
        amount,
        successUrl,
        cancelUrl,
    }: BuildSepayCheckoutParams): ResolveCheckoutResult {
        const fields = this.sepay.checkout.initOneTimePaymentFields({
            operation: "PURCHASE",
            order_invoice_number: String(orderCode),
            order_amount: amount,
            currency: "VND",
            order_description: `AI subscription ${orderCode}`,
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
    private generateOrderCode(): number {
        // millisecond timestamp keeps codes ordered; the suffix comes from the
        // CSPRNG because this code IS the payment reference the gateway and the
        // webhook look the transaction up by -- a Math.random suffix is guessable.
        return Date.now() * 1000 + randomInt(1000)
    }
}
