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
        const amount = tierConfig.priceVnd

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
            orderCode,
            payosReturnUrl,
            payosCancelUrl,
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
        orderCode,
        payosReturnUrl,
        payosCancelUrl,
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
