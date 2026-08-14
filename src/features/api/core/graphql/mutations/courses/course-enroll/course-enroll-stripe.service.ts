import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
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
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException,
} from "@modules/platform/exceptions/errors/courses/payos-return-url-and-payos-cancel-url-must-be-required"
import {
    MissingUsdPriceException,
} from "@modules/platform/exceptions/errors/payment/missing-usd-price"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    InjectStripe,
} from "@modules/integrations/stripe/stripe.providers"
import {
    Injectable,
} from "@nestjs/common"
import type {
    Stripe,
} from "stripe"
import type {
    EntityManager,
} from "typeorm"
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
    CoursePricingService,
} from "./course-pricing.service"
import {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    CourseEnrollRequest,
} from "./graphql-types/request"
import type {
    CourseEnrollResponseData,
} from "./graphql-types/response"
import {
    withCheckoutAdvisoryLock,
} from "./checkout-advisory-lock"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    LoyaltyDiscountService,
} from "@modules/bussiness/loyalty/loyalty-discount.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"

@Injectable()
/**
 * Stripe-specific course enrollment: creates a hosted Checkout Session
 * (redirect provider) and persists a pending preflight row.
 *
 * International gateway -> charges the explicit USD price (`pricing_phases.priceUsd`),
 * not the VND amount. Stripe `unit_amount` is the smallest currency unit (cents), so
 * the USD dollar price is multiplied by 100. The VND price is still stored on the
 * transaction as a stable reference.
 *
 * Honours a **Percent** `request.voucherCode` (currency-agnostic -- applies to
 * `priceUsd`) per `PAYMENT_MODIFIER_CAPABILITY`; a Flat (VND) voucher is
 * rejected before dispatch (see course-enroll.handler.ts), so this service
 * only ever sees Percent here. Same preview -> reserve pattern as
 * {@link CourseEnrollSepayService}.
 */
export class CourseEnrollStripeService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectStripe()
        private readonly stripe: Stripe,
        private readonly dayjsService: DayjsService,
        private readonly coursePricingService: CoursePricingService,
        private readonly retryService: RetryService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly loyaltyDiscountService: LoyaltyDiscountService,
        private readonly voucherService: VoucherService,
    ) {}

    /**
     * Creates a Stripe Checkout Session and persists a pending preflight row.
     *
     * @param param - Course context, user, and redirect URLs (reused as Stripe URLs)
     * @returns Checkout payload (redirect URL) and preflight id
     */
    async execute(params: ExecuteParams<CourseEnrollRequest>): Promise<CourseEnrollResponseData> {
        if (!params.user) {
            throw new UserNotFoundException({
            })
        }
        return withCheckoutAdvisoryLock(
            this.entityManager,
            params.request.voucherCode
                ? `checkout:voucher:${params.user.id}:${params.request.voucherCode}`
                : `checkout:course:${params.user.id}:${params.request.courseId}:${PaymentType.Stripe}`,
            async (manager) => this.executeLocked(params,
                manager),
        )
    }

    private async executeLocked({
        request: {
            courseId,
            payosReturnUrl,
            payosCancelUrl,
            voucherCode,
        },
        user,
    }: ExecuteParams<CourseEnrollRequest>, manager: EntityManager): Promise<CourseEnrollResponseData> {
        // a logged-in user is required to attach the transaction to
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // resolve the course + its pricing phases
        const course = await manager.findOne(
            CourseEntity,
            {
                where: {
                    id: courseId,
                },
                relations: {
                    pricingPhases: true,
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException({
                id: courseId,
            })
        }
        // loyalty discount applied at checkout (so charged === shown)
        const {
            percent: discountPercent,
        } = await this.loyaltyDiscountService.computeLoyaltyDiscount({
            userId: user.id,
        })
        // VND amount is kept on the transaction as a stable reference value
        const amount = this.coursePricingService.resolveAmountVnd({
            course,
            discountPercent,
        })
        // international gateway charges the explicit USD price (no runtime FX)
        const priceUsd = this.coursePricingService.resolveAmountUsd({
            course,
            discountPercent,
        })
        // never charge VND as USD -- reject when no USD price is configured
        if (!priceUsd || priceUsd <= 0) {
            throw new MissingUsdPriceException({
                paymentType: PaymentType.Stripe,
                courseId: course.id,
            })
        }

        // an invalid/unsupported code throws HERE (before any row or Stripe
        // session is created) -- a valid Percent voucher further discounts the
        // USD price. A Flat voucher never reaches here (rejected before dispatch
        // in course-enroll.handler.ts -- Flat is VND-only per PAYMENT_MODIFIER_CAPABILITY).
        const discountedPriceUsd = voucherCode
            ? this.voucherService.applyToAmount(
                priceUsd,
                await this.voucherService.previewDiscount({
                    userId: user.id,
                    code: voucherCode,
                    courseId: course.id,
                }),
            )
            : priceUsd

        // reuse a still-fresh pending Stripe transaction instead of re-creating
        const existing = await manager.findOne(
            TransactionEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: course.id,
                    },
                    status: TransactionStatus.Pending,
                    paymentType: PaymentType.Stripe,
                },
            },
        )
        if (existing && this.isReusable(existing)) {
            return {
                checkoutUrl: existing.checkoutUrl,
                referenceId: existing.referenceId,
                transactionId: existing.id,
                amount: existing.amount,
            }
        }

        // Stripe needs explicit success/cancel redirect URLs
        if (!payosReturnUrl || !payosCancelUrl) {
            throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException({
                hasPayOsReturnUrl: Boolean(payosReturnUrl),
                hasPayOsCancelUrl: Boolean(payosCancelUrl),
            })
        }
        // our internal reference id doubles as the Stripe client_reference_id
        const orderCode = this.generateOrderCode()
        const currentPhase = this.coursePricingService.getCurrentPricingPhase(course)
        const {
            currency,
        } = envConfig().services.api.stripe
        // create the Checkout Session (retried on transient network/5xx errors)
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
                            unit_amount: Math.round(discountedPriceUsd * 100),
                            product_data: {
                                name: `Course enrollment ${orderCode}`,
                            },
                        },
                    },
                ],
            }),
        })
        // persist the pending transaction + (if given) RESERVE the voucher in the
        // SAME db transaction, so a concurrent second checkout can never also
        // claim the same code
        const transaction = await manager.transaction(async (transactionManager) => {
            const created = transactionManager.create(
                TransactionEntity,
                {
                    user,
                    course,
                    referenceId: String(orderCode),
                    amount,
                    discountPercent,
                    voucherCode: voucherCode ?? null,
                    pricingPhase: currentPhase,
                    paymentType: PaymentType.Stripe,
                    // session.url is the hosted page the browser redirects to
                    checkoutUrl: session.url ?? "",
                    // store the session id so reconciliation can poll Stripe by id
                    providerPaymentId: session.id,
                    status: TransactionStatus.Pending,
                    actionType: ActionType.Enroll,
                },
            )
            const saved = await transactionManager.save(created)
            if (voucherCode) {
                // re-validate + reserve UNDER LOCK -- the earlier previewDiscount() was
                // advisory only (no lock held), so a race since then is still caught here
                await this.voucherService.reserve({
                    entityManager: transactionManager,
                    userId: user.id,
                    code: voucherCode,
                    courseId: course.id,
                    transactionId: saved.id,
                })
            }
            return saved
        })
        // schedule the delayed reconcile poll (fires if no webhook arrives)
        await this.enqueueReconcileTransactionJobService.enqueue({
            transactionId: transaction.id,
        })

        // redirect provider -> no signed form fields (checkoutFields stays null)
        return {
            checkoutUrl: session.url ?? "",
            referenceId: String(orderCode),
            transactionId: transaction.id,
            amount,
        }
    }

    /**
     * Whether a pending transaction is recent enough to hand back.
     *
     * @param transaction - The pending transaction row
     * @returns True when within the reuse window
     */
    private isReusable(
        transaction: TransactionEntity,
    ): boolean {
        // compare the row age against the configured reuse window
        const timeSinceCreationMs = this.dayjsService.now().diff(
            this.dayjsService.from(transaction.createdAt),
            "milliseconds",
        )
        return timeSinceCreationMs < envConfig().services.api.transaction.timeSinceCreationMs
    }

    /**
     * Generates a unique order code stored as the transaction reference.
     *
     * @returns Integer order code.
     */
    private generateOrderCode(): number {
        // millisecond timestamp + random suffix keeps codes unique per request
        return Date.now() * 1000 + Math.floor(
            Math.random() * 1000,
        )
    }
}
