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
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    CheckoutGatewayService,
} from "@modules/bussiness/transactions/atomic/checkout-gateway.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
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

/** Label used in provider descriptions for AI-subscription checkouts. */
const AI_SUBSCRIPTION_PRODUCT_LABEL = "AI subscription"

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
        private readonly checkoutGatewayService: CheckoutGatewayService,
        private readonly mountFilesystemService: MountFilesystemService,
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
            // reuse scope: this user's own pending order for this exact tier + gateway
            const existing = await this.checkoutGatewayService.acquirePendingTransaction({
                manager,
                lockKey: `checkout:ai-subscription:${user.id}:${tier}:${paymentType}`,
                where: {
                    user: {
                        id: user.id
                    },
                    actionType: ActionType.AiSubscriptionPurchase,
                    aiSubTier: tier,
                    paymentType,
                    status: TransactionStatus.Pending,
                },
            })
            if (existing) {
                const checkoutFields = existing.paymentType === PaymentType.Sepay
                    ? this.checkoutGatewayService.buildSepayCheckout({
                        orderCode: Number(existing.referenceId),
                        amount: existing.amount,
                        productLabel: AI_SUBSCRIPTION_PRODUCT_LABEL,
                    }).checkoutFields
                    : undefined
                return {
                    transaction: existing, checkoutFields
                }
            }

            const orderCode = this.checkoutGatewayService.generateOrderCode()
            const checkout = await this.checkoutGatewayService.resolveCheckout({
                paymentType,
                amount,
                priceUsd,
                orderCode,
                payosReturnUrl,
                payosCancelUrl,
                productLabel: AI_SUBSCRIPTION_PRODUCT_LABEL,
                exceptionTier: tier,
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
}
