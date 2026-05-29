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
    NowPaymentsClient,
} from "@modules/nowpayments"
import {
    Injectable,
} from "@nestjs/common"
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

/**
 * Crypto (NOWPayments) course enrollment: creates a hosted invoice (redirect
 * provider, USDT/USDC) and persists a pending preflight row.
 *
 * International gateway → charges the explicit USD price (`pricing_phases.priceUsd`)
 * as the invoice `price_amount` (dollars in the configured price currency), not the
 * VND amount. The VND price is still stored on the transaction as a stable reference.
 */
@Injectable()
export class CourseEnrollCryptoService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly nowPaymentsClient: NowPaymentsClient,
        private readonly dayjsService: DayjsService,
        private readonly coursePricingService: CoursePricingService,
        private readonly retryService: RetryService,
    ) {}

    /**
     * Creates a NOWPayments invoice and persists a pending preflight row.
     *
     * @param param - Course context, user, and redirect URLs (reused as invoice URLs)
     * @returns Checkout payload (invoice URL) and preflight id
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
                paymentType: PaymentType.Crypto,
                courseId: course.id,
            })
        }

        // reuse a still-fresh pending crypto transaction instead of re-creating
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
                    paymentType: PaymentType.Crypto,
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

        // NOWPayments needs explicit success/cancel redirect URLs
        if (!payosReturnUrl || !payosCancelUrl) {
            throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError({
                hasPayOsReturnUrl: Boolean(payosReturnUrl),
                hasPayOsCancelUrl: Boolean(payosCancelUrl),
            })
        }
        // our internal reference id is echoed back via the invoice order_id
        const orderCode = this.generateOrderCode()
        const currentPhase = this.coursePricingService.getCurrentPricingPhase(course)
        // create the invoice (retried on transient network/5xx errors)
        const invoice = await this.retryService.retry({
            action: async () => this.nowPaymentsClient.createInvoice({
                // NOWPayments charges USD dollars as price_amount in the price currency
                amount: priceUsd,
                referenceId: String(orderCode),
                description: `Course enrollment ${orderCode}`,
                successUrl: payosReturnUrl,
                cancelUrl: payosCancelUrl,
            }),
        })
        // persist the pending transaction with the hosted invoice URL
        const transaction = this.entityManager.create(
            TransactionEntity,
            {
                user,
                course,
                referenceId: String(orderCode),
                amount,
                pricingPhase: currentPhase,
                paymentType: PaymentType.Crypto,
                // invoiceUrl is the hosted page the browser redirects to
                checkoutUrl: invoice.invoiceUrl,
                status: TransactionStatus.Pending,
                actionType: ActionType.Enroll,
            },
        )
        await this.entityManager.save(transaction)

        // redirect provider → no signed form fields (checkoutFields stays null)
        return {
            checkoutUrl: invoice.invoiceUrl,
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
