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
    MembershipNotAvailableException,
} from "@modules/platform/exceptions/errors/membership/membership-not-available"
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
    PurchaseMembershipCommand,
} from "./purchase-membership.command"
import {
    PurchaseMembershipResponseData,
} from "./graphql-types/response"

/** Label used in missing-USD-price metadata. */
const MEMBERSHIP_LABEL = "community-membership"

/** Label used in provider descriptions for membership checkouts. */
const MEMBERSHIP_PRODUCT_LABEL = "Community membership"

@CommandHandler(PurchaseMembershipCommand)
@Injectable()
/**
 * Opens community-membership checkout: pending transaction first, then a
 * provider URL / SePay form. Activation is webhook + reconcile -- this path
 * must not flip membership on.
 */
export class PurchaseMembershipHandler
    extends ICQRSHandler<PurchaseMembershipCommand, PurchaseMembershipResponseData>
    implements ICommandHandler<PurchaseMembershipCommand, PurchaseMembershipResponseData> {
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
        command: PurchaseMembershipCommand,
    ): Promise<PurchaseMembershipResponseData> {
        const {
            request: {
                paymentType,
                payosReturnUrl,
                payosCancelUrl,
            },
            user,
        } = command.params

        // an authenticated user is required to own the membership
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // resolve the single membership price from the live catalog (must be enabled)
        const membershipConfig = this.mountFilesystemService
            .appConfig()
            .membership
        if (!membershipConfig.enabled) {
            throw new MembershipNotAvailableException({
            })
        }
        // domestic gateways (PayOS / Sepay) charge this VND price
        const amount = membershipConfig.priceVnd
        // international gateways (Stripe / PayPal / Crypto) charge this USD dollar price
        const priceUsd = membershipConfig.priceUsd

        const committed = await this.entityManager.transaction(async (manager) => {
            // reuse scope: this user's own pending order for this gateway --
            // membership has only one price, so no extra tier filter is needed
            const existing = await this.checkoutGatewayService.acquirePendingTransaction({
                manager,
                lockKey: `checkout:membership:${user.id}:${paymentType}`,
                where: {
                    user: {
                        id: user.id
                    },
                    actionType: ActionType.MembershipPurchase,
                    paymentType,
                    status: TransactionStatus.Pending,
                },
            })
            if (existing) {
                const checkoutFields = existing.paymentType === PaymentType.Sepay
                    ? this.checkoutGatewayService.buildSepayCheckout({
                        orderCode: Number(existing.referenceId),
                        amount: existing.amount,
                        productLabel: MEMBERSHIP_PRODUCT_LABEL,
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
                productLabel: MEMBERSHIP_PRODUCT_LABEL,
                exceptionTier: MEMBERSHIP_LABEL,
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
                    actionType: ActionType.MembershipPurchase,
                    aiSubTier: null,
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
