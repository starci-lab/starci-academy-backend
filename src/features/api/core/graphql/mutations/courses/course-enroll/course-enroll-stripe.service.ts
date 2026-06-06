import {
    ActionType,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    PaymentType,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError,
    CourseNotFoundException,
    MissingUsdPriceException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    InjectStripe,
} from "@modules/stripe"
import {
    Injectable,
} from "@nestjs/common"
import Stripe from "stripe"
import type {
    EntityManager,
} from "typeorm"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"
import {
    envConfig,
} from "@modules/env"
import {
    CoursePricingService,
} from "./course-pricing.service"
import {
    ExecuteParams,
} from "../../../../types"
import type {
    CourseEnrollRequest,
    CourseEnrollResponseData,
} from "./graphql-types"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness"

/**
 * Stripe-specific course enrollment: creates a hosted Checkout Session
 * (redirect provider) and persists a pending preflight row.
 *
 * International gateway → charges the explicit USD price (`pricing_phases.priceUsd`),
 * not the VND amount. Stripe `unit_amount` is the smallest currency unit (cents), so
 * the USD dollar price is multiplied by 100. The VND price is still stored on the
 * transaction as a stable reference.
 */
@Injectable()
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
    ) {}

    /**
     * Creates a Stripe Checkout Session and persists a pending preflight row.
     *
     * @param param - Course context, user, and redirect URLs (reused as Stripe URLs)
     * @returns Checkout payload (redirect URL) and preflight id
     */
    async execute({
        request: {
            courseId,
            payosReturnUrl,
            payosCancelUrl,
        },
        user,
    }: ExecuteParams<CourseEnrollRequest>): Promise<CourseEnrollResponseData> {
        // a logged-in user is required to attach the transaction to
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // resolve the course + its pricing phases
        const course = await this.entityManager.findOne(
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
        // VND amount is kept on the transaction as a stable reference value
        const amount = this.coursePricingService.resolveAmountVnd({
            course,
        })
        // international gateway charges the explicit USD price (no runtime FX)
        const priceUsd = this.coursePricingService.resolveAmountUsd({
            course,
        })
        // never charge VND as USD — reject when no USD price is configured
        if (!priceUsd || priceUsd <= 0) {
            throw new MissingUsdPriceException({
                paymentType: PaymentType.Stripe,
                courseId: course.id,
            })
        }

        // reuse a still-fresh pending Stripe transaction instead of re-creating
        const existing = await this.entityManager.findOne(
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
            throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
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
                            // Stripe expects cents → convert USD dollars to integer cents
                            unit_amount: Math.round(priceUsd * 100),
                            product_data: {
                                name: `Course enrollment ${orderCode}`,
                            },
                        },
                    },
                ],
            }),
        })
        // persist the pending transaction with the hosted checkout URL
        const transaction = this.entityManager.create(
            TransactionEntity,
            {
                user,
                course,
                referenceId: String(orderCode),
                amount,
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
        await this.entityManager.save(transaction)
        // schedule the delayed reconcile poll (fires if no webhook arrives)
        await this.enqueueReconcileTransactionJobService.enqueue({
            transactionId: transaction.id,
        })

        // redirect provider → no signed form fields (checkoutFields stays null)
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
