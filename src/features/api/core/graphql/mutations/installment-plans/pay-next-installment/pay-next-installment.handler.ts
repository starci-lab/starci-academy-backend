import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    InstallmentPlanEntity,
    InstallmentPlanStatus,
    InstallmentPlanType,
    PaymentType,
    PricingPhase,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    InstallmentAmountBelowMinimumException,
    InstallmentCurrencyNotSupportedException,
    InstallmentCustomAmountNotAllowedException,
    InstallmentPlanNotFoundException,
    InstallmentPlanNotPayableException,
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    EnqueueReconcileTransactionJobService,
    InstallmentPlanService,
} from "@modules/bussiness"
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
    PayNextInstallmentCommand,
} from "./pay-next-installment.command"
import {
    PayNextInstallmentResponseData,
} from "./graphql-types"
import type {
    BuildSepayInstallmentCheckoutParams,
    ResolveInstallmentCheckoutParams,
    ResolveInstallmentCheckoutResult,
} from "./types"

/** Label used in provider descriptions. */
const INSTALLMENT_PAYMENT_LABEL = "installment-payment"

@CommandHandler(PayNextInstallmentCommand)
@Injectable()
/**
 * Pays the CURRENT cycle of an installment plan: charges exactly
 * `InstallmentPlanService.computeMinPaymentVnd(plan)` -- never the whole
 * remaining balance -- via a fresh (or reused-pending) gateway checkout. The
 * plan itself only advances once the payment is confirmed
 * (`ReconcileTransactionWorker.finalize()` -> `InstallmentPlanService.
 * applyPaymentForTransaction`), exactly like every other purchase in this
 * codebase -- this handler only ever creates the pending checkout.
 *
 * MVP is VND-only (see `docs/installment-payment-plan.md`): only PayOS and
 * Sepay are supported; every other {@link PaymentType} is rejected.
 */
export class PayNextInstallmentHandler
    extends ICQRSHandler<PayNextInstallmentCommand, PayNextInstallmentResponseData>
    implements ICommandHandler<PayNextInstallmentCommand, PayNextInstallmentResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectPayOS()
        private readonly payos: PayOS,
        @InjectSepay()
        private readonly sepay: SePayPgClient,
        private readonly installmentPlanService: InstallmentPlanService,
        private readonly dayjsService: DayjsService,
        private readonly retryService: RetryService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
    ) {
        super()
    }

    /**
     * Resolve the plan, refuse to charge a completed one, reuse a still-fresh
     * pending checkout for the same provider when present, otherwise create a
     * new one for the current cycle's minimum payment.
     *
     * @param command - The pay-next-installment command (request + auth context).
     * @returns The checkout payload for the client.
     */
    protected override async process(
        command: PayNextInstallmentCommand,
    ): Promise<PayNextInstallmentResponseData> {
        const {
            request: {
                planId,
                paymentType,
                returnUrl,
                cancelUrl,
                amountVnd,
            },
            user,
        } = command.params

        // an authenticated user is required to own the plan
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const plan = await this.entityManager.findOne(
            InstallmentPlanEntity,
            {
                where: {
                    id: planId,
                },
            },
        )
        // collapse "doesn't exist" and "belongs to someone else" into one error
        // so ownership is never leaked to the caller
        if (!plan || plan.userId !== user.id) {
            throw new InstallmentPlanNotFoundException({
                planId,
                userId: user.id,
            })
        }
        if (plan.status === InstallmentPlanStatus.Completed) {
            throw new InstallmentPlanNotPayableException({
                planId,
                status: plan.status,
            })
        }

        const minPaymentVnd = this.installmentPlanService.computeMinPaymentVnd(plan)
        // FlexiblePool may top up MORE than the minimum (shrinks future cycles);
        // Fixed always charges the fixed monthly amount, never a custom one.
        let amount = minPaymentVnd
        if (amountVnd != null) {
            if (plan.planType !== InstallmentPlanType.FlexiblePool) {
                throw new InstallmentCustomAmountNotAllowedException({
                    planId,
                    planType: plan.planType,
                })
            }
            if (amountVnd < minPaymentVnd) {
                throw new InstallmentAmountBelowMinimumException({
                    planId,
                    requestedVnd: amountVnd,
                    minPaymentVnd,
                })
            }
            amount = amountVnd
        }

        // reuse a still-fresh pending transaction for the same plan + provider
        // (mirrors the AI-subscription / membership checkout reuse window) --
        // avoids opening a second gateway payment while one is already pending
        const existing = await this.entityManager.findOne(
            TransactionEntity,
            {
                where: {
                    installmentPlanId: plan.id,
                    actionType: ActionType.InstallmentPayment,
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
                planId: plan.id,
                checkoutUrl: existing.checkoutUrl,
                referenceId: existing.referenceId,
                transactionId: existing.id,
                amount: existing.amount,
                checkoutFields: reuseFields,
            }
        }

        const orderCode = this.generateOrderCode()
        const checkout = await this.resolveCheckout({
            paymentType,
            amount,
            orderCode,
            returnUrl,
            cancelUrl,
        })

        // persist the pending cycle payment, linked back to the plan so the
        // reconcile worker knows to call `InstallmentPlanService.recordPayment`
        const transaction = this.entityManager.create(
            TransactionEntity,
            {
                user,
                course: null,
                referenceId: String(orderCode),
                amount: checkout.amount,
                discountPercent: 0,
                pricingPhase: PricingPhase.Regular,
                paymentType,
                checkoutUrl: checkout.checkoutUrl,
                providerPaymentId: null,
                status: TransactionStatus.Pending,
                actionType: ActionType.InstallmentPayment,
                aiSubTier: null,
                installmentPlanId: plan.id,
            },
        )
        await this.entityManager.save(transaction)
        // schedule the delayed reconcile poll (fires if no webhook arrives)
        await this.enqueueReconcileTransactionJobService.enqueue({
            transactionId: transaction.id,
        })

        return {
            planId: plan.id,
            checkoutUrl: checkout.checkoutUrl,
            referenceId: String(orderCode),
            transactionId: transaction.id,
            amount: checkout.amount,
            checkoutFields: checkout.checkoutFields,
        }
    }

    /**
     * Whether a pending transaction is recent enough to hand back instead of
     * creating a new checkout (mirrors the membership/AI-subscription reuse window).
     *
     * @param transaction - The still-pending transaction found for this plan + provider.
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
     * Create a checkout link for the chosen provider (PayOS / Sepay only --
     * MVP is VND-only, see the class doc comment).
     *
     * @param params - Payment type, the cycle's charged amount, order code, and redirect URLs.
     * @throws PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError when PayOS redirect URLs are missing.
     * @throws InstallmentCurrencyNotSupportedException when the payment type is not PayOS or Sepay.
     */
    private async resolveCheckout({
        paymentType,
        amount,
        orderCode,
        returnUrl,
        cancelUrl,
    }: ResolveInstallmentCheckoutParams): Promise<ResolveInstallmentCheckoutResult> {
        switch (paymentType) {
        case PaymentType.PayOS: {
            if (!returnUrl || !cancelUrl) {
                throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
                    hasPayOsReturnUrl: Boolean(returnUrl),
                    hasPayOsCancelUrl: Boolean(cancelUrl),
                })
            }
            const paymentLink = await this.retryService.retry({
                action: async () => this.payos.paymentRequests.create({
                    amount,
                    cancelUrl,
                    description: "EN",
                    orderCode,
                    returnUrl,
                }),
            })
            return {
                checkoutUrl: paymentLink.checkoutUrl,
                amount: paymentLink.amount,
            }
        }
        case PaymentType.Sepay: {
            return this.buildSepayCheckout({
                orderCode,
                amount,
                successUrl: returnUrl,
                cancelUrl,
            })
        }
        default:
            throw new InstallmentCurrencyNotSupportedException({
                paymentType: String(paymentType),
            })
        }
    }

    /**
     * Build a SePay PG one-time-payment checkout: sign the order fields and
     * return the form action URL + the JSON-encoded signed fields. Pure
     * (local HMAC signing) -- safe to call on the transaction-reuse path too.
     *
     * @param params - Order code, VND amount, and redirect URLs.
     */
    private buildSepayCheckout({
        orderCode,
        amount,
        successUrl,
        cancelUrl,
    }: BuildSepayInstallmentCheckoutParams): ResolveInstallmentCheckoutResult {
        const fields = this.sepay.checkout.initOneTimePaymentFields({
            operation: "PURCHASE",
            order_invoice_number: String(orderCode),
            order_amount: amount,
            currency: "VND",
            order_description: `${INSTALLMENT_PAYMENT_LABEL} ${orderCode}`,
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
     *
     * @returns A unique-per-request integer order code.
     */
    private generateOrderCode(): number {
        return Date.now() * 1000 + Math.floor(
            Math.random() * 1000,
        )
    }
}
