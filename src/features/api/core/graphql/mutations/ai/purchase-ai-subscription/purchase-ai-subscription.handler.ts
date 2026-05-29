import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    PaymentType,
    PricingPhase,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    AiSubscriptionTierNotAvailableException,
    MissingUsdPriceException,
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"
import {
    envConfig,
} from "@modules/env"
import {
    InjectPayOS,
} from "@modules/payos"
import {
    PayOS,
} from "@payos/node"
import {
    InjectSepay,
} from "@modules/sepay"
import {
    SePayPgClient,
} from "sepay-pg-node"
import {
    InjectStripe,
} from "@modules/stripe"
import Stripe from "stripe"
import {
    PaypalClient,
} from "@modules/paypal"
import {
    NowPaymentsClient,
} from "@modules/nowpayments"
import {
    BadRequestException,
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
} from "./graphql-types"
import type {
    BuildSepayCheckoutParams,
    ResolveCheckoutParams,
    ResolveCheckoutResult,
} from "./types"

@CommandHandler(PurchaseAiSubscriptionCommand)
@Injectable()
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

        // reuse a still-fresh pending transaction for the same tier + provider
        const existing = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    actionType: ActionType.AiSubscriptionPurchase,
                    aiSubTier: tier,
                    paymentType,
                    status: TransactionStatus.Pending,
                },
            },
        )
        if (existing && this.isReusable(existing)) {
            // SePay PG needs the signed form fields regenerated (pure, no side effect)
            const reuseFields = existing.paymentType === PaymentType.Sepay
                ? this.buildSepayCheckout({
                    orderCode: Number(existing.referenceId),
                    amount: existing.amount,
                }).checkoutFields
                : undefined
            return {
                checkoutUrl: existing.checkoutUrl,
                referenceId: existing.referenceId,
                transactionId: existing.id,
                amount: existing.amount,
                checkoutFields: reuseFields,
            }
        }

        // create the provider checkout link
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

        // persist the pending transaction (course is null for AI purchases)
        const transaction = this.entityManager.create(
            TransactionEntity,
            {
                user,
                course: null,
                referenceId: String(orderCode),
                amount: checkout.amount,
                pricingPhase: PricingPhase.Regular,
                paymentType,
                checkoutUrl: checkout.checkoutUrl,
                status: TransactionStatus.Pending,
                actionType: ActionType.AiSubscriptionPurchase,
                aiSubTier: tier,
            },
        )
        await this.entityManager.save(transaction)

        return {
            checkoutUrl: checkout.checkoutUrl,
            referenceId: String(orderCode),
            transactionId: transaction.id,
            amount: checkout.amount,
            checkoutFields: checkout.checkoutFields,
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
     * @throws PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError when PayOS URLs are missing
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
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
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
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
                    hasPayOsReturnUrl: Boolean(payosReturnUrl),
                    hasPayOsCancelUrl: Boolean(payosCancelUrl),
                })
            }
            // never charge VND as USD — reject when no USD price is configured
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
                                // Stripe expects cents → convert USD dollars to integer cents
                                unit_amount: Math.round(priceUsd * 100),
                                product_data: {
                                    name: `AI subscription ${orderCode}`,
                                },
                            },
                        },
                    ],
                }),
            })
            // redirect provider → no signed form fields; amount stays VND reference
            return {
                checkoutUrl: session.url ?? "",
                amount,
            }
        }
        case PaymentType.Paypal: {
            // PayPal (redirect): needs explicit return/cancel URLs
            if (!payosReturnUrl || !payosCancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
                    hasPayOsReturnUrl: Boolean(payosReturnUrl),
                    hasPayOsCancelUrl: Boolean(payosCancelUrl),
                })
            }
            // never charge VND as USD — reject when no USD price is configured
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
            // redirect provider → no signed form fields; amount stays VND reference
            return {
                checkoutUrl: order.approveUrl,
                amount,
            }
        }
        case PaymentType.Crypto: {
            // NOWPayments (redirect): needs explicit success/cancel URLs
            if (!payosReturnUrl || !payosCancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
                    hasPayOsReturnUrl: Boolean(payosReturnUrl),
                    hasPayOsCancelUrl: Boolean(payosCancelUrl),
                })
            }
            // never charge VND as USD — reject when no USD price is configured
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
            // redirect provider → no signed form fields; amount stays VND reference
            return {
                checkoutUrl: invoice.invoiceUrl,
                amount,
            }
        }
        default:
            throw new BadRequestException(
                `Unsupported payment type: ${String(paymentType)}`,
            )
        }
    }

    /**
     * Build a SePay PG one-time-payment checkout: sign the order fields and
     * return the form action URL + the JSON-encoded signed fields. Pure (local
     * HMAC signing) — safe to call on the transaction-reuse path too.
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
        return Date.now() * 1000 + Math.floor(
            Math.random() * 1000,
        )
    }
}
