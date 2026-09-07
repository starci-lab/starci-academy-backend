import {
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    ProSubscriptionService,
} from "@modules/bussiness/pro-subscription/pro-subscription.service"
import {
    CheckoutGatewayService,
} from "@modules/bussiness/transactions/atomic/checkout-gateway.service"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
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
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    UnsupportedPaymentTypeException,
} from "@modules/platform/exceptions/errors/payment/unsupported-payment-type"
import {
    ProSubscriptionNotAvailableException,
} from "@modules/platform/exceptions/errors/pro-subscription/pro-subscription-not-available"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import type {
    EntityManager,
} from "typeorm"
import {
    MyProSubscriptionResponse,
    ProCheckoutResponse,
    PurchaseProSubscriptionRequest,
} from "../../shared/pro-subscription/graphql-types"

@Resolver()
/** Creates domestic Pro checkouts and records manual renewal cancellation. */
export class ProSubscriptionMutationsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly checkoutGatewayService: CheckoutGatewayService,
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly proSubscriptionService: ProSubscriptionService,
    ) {}

    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(() => ProCheckoutResponse,
        {
            name: "purchaseProSubscription",
        })
    async purchase(
        @Args("request") request: PurchaseProSubscriptionRequest,
        @KeycloakGraphQLUser() user: UserEntity,
    ) {
        if (![PaymentType.PayOS,
            PaymentType.Sepay].includes(request.paymentType)) {
            throw new UnsupportedPaymentTypeException({
                paymentType: request.paymentType,
            })
        }
        const offer = this.mountFilesystemService.appConfig().proSubscription
        if (!offer?.enabled) {
            throw new ProSubscriptionNotAvailableException({
            })
        }
        const committed = await this.entityManager.transaction(async (manager) => {
            const existing = await this.checkoutGatewayService.acquirePendingTransaction({
                manager,
                lockKey: `checkout:pro:${user.id}:${request.paymentType}`,
                where: {
                    user: {
                        id: user.id,
                    },
                    actionType: ActionType.ProSubscriptionPurchase,
                    paymentType: request.paymentType,
                    status: TransactionStatus.Pending,
                    offerRevision: offer.offerRevision,
                },
            })
            if (existing) {
                return {
                    transaction: existing,
                    checkoutFields: existing.paymentType === PaymentType.Sepay
                        ? this.checkoutGatewayService.buildSepayCheckout({
                            orderCode: Number(existing.referenceId),
                            amount: existing.amount,
                            successUrl: request.payosReturnUrl,
                            cancelUrl: request.payosCancelUrl,
                            productLabel: "StarCi Pro",
                        }).checkoutFields
                        : undefined,
                }
            }
            const orderCode = this.checkoutGatewayService.generateOrderCode()
            const checkout = await this.checkoutGatewayService.resolveCheckout({
                paymentType: request.paymentType,
                amount: offer.priceVnd,
                priceUsd: 0,
                orderCode,
                payosReturnUrl: request.payosReturnUrl,
                payosCancelUrl: request.payosCancelUrl,
                productLabel: "StarCi Pro",
                exceptionTier: offer.planId,
            })
            const transaction = manager.create(TransactionEntity,
                {
                    user,
                    course: null,
                    referenceId: String(orderCode),
                    amount: checkout.amount,
                    pricingPhase: PricingPhase.Regular,
                    paymentType: request.paymentType,
                    checkoutUrl: checkout.checkoutUrl,
                    providerPaymentId: checkout.providerPaymentId ?? null,
                    status: TransactionStatus.Pending,
                    actionType: ActionType.ProSubscriptionPurchase,
                    aiSubTier: null,
                    offerRevision: offer.offerRevision,
                })
            return {
                transaction: await manager.save(transaction),
                checkoutFields: checkout.checkoutFields,
            }
        })
        await this.enqueueReconcileTransactionJobService.enqueue({
            transactionId: committed.transaction.id,
        })
        return {
            checkoutUrl: committed.transaction.checkoutUrl,
            referenceId: committed.transaction.referenceId,
            transactionId: committed.transaction.id,
            amount: committed.transaction.amount,
            checkoutFields: committed.checkoutFields,
        }
    }

    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(() => MyProSubscriptionResponse,
        {
            name: "cancelProRenewal",
        })
    async cancel(@KeycloakGraphQLUser() user: UserEntity) {
        const subscription = await this.proSubscriptionService.cancelAtPeriodEnd(user.id)
        return {
            subscription,
            active: await this.proSubscriptionService.isActive(user.id),
        }
    }
}
