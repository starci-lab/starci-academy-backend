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
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import {
    Injectable,
} from "@nestjs/common"
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
import type {
    CoursePriceQuoteResult,
} from "@modules/bussiness/course-pricing/types"
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
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"

@Injectable()
/**
 * Crypto (NOWPayments) course enrollment: creates a hosted invoice (redirect
 * provider, USDT/USDC) and persists a pending preflight row.
 *
 * International gateway -> charges the explicit USD price (`pricing_phases.priceUsd`)
 * as the invoice `price_amount` (dollars in the configured price currency), not the
 * VND amount. The VND price is still stored on the transaction as a stable reference.
 *
 * Honours a **Percent** `request.voucherCode` (currency-agnostic -- applies to
 * `priceUsd`) per `PAYMENT_MODIFIER_CAPABILITY`; a Flat (VND) voucher is
 * rejected before dispatch (see course-enroll.handler.ts), so this service
 * only ever sees Percent here. Same preview -> reserve pattern as
 * {@link CourseEnrollSepayService}.
 */
export class CourseEnrollCryptoService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly nowPaymentsClient: NowPaymentsClient,
        private readonly dayjsService: DayjsService,
        private readonly retryService: RetryService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly voucherService: VoucherService,
    ) {}

    /**
     * Creates a NOWPayments invoice and persists a pending preflight row.
     *
     * @param param - Course context, user, and redirect URLs (reused as invoice URLs)
     * @returns Checkout payload (invoice URL) and preflight id
     */
    async execute(
        params: ExecuteParams<CourseEnrollRequest>,
        quote: CoursePriceQuoteResult,
    ): Promise<CourseEnrollResponseData> {
        if (!params.user) {
            throw new UserNotFoundException({
            })
        }
        return withCheckoutAdvisoryLock(
            this.entityManager,
            params.request.voucherCode
                ? `checkout:voucher:${params.user.id}:${params.request.voucherCode}`
                : `checkout:course:${params.user.id}:${params.request.courseId}:${PaymentType.Crypto}`,
            async (manager) => this.executeLocked(params,
                quote,
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
    }: ExecuteParams<CourseEnrollRequest>, quote: CoursePriceQuoteResult,
    manager: EntityManager): Promise<CourseEnrollResponseData> {
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
        const line = quote.lines[0]
        const discountPercent = line.displayDiscountPercent
        const amount = quote.totalChargedVnd
        const priceUsd = quote.totalChargedUsd
        // never charge VND as USD -- reject when no USD price is configured
        if (!priceUsd || priceUsd <= 0) {
            throw new MissingUsdPriceException({
                paymentType: PaymentType.Crypto,
                courseId: course.id,
            })
        }

        // an invalid/unsupported code throws HERE (before any row or invoice is
        // created) -- a valid Percent voucher further discounts the USD price. A
        // Flat voucher never reaches here (rejected before dispatch in
        // course-enroll.handler.ts -- Flat is VND-only per PAYMENT_MODIFIER_CAPABILITY).
        const discountedPriceUsd = priceUsd

        // reuse a still-fresh pending crypto transaction instead of re-creating
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
            throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException({
                hasPayOsReturnUrl: Boolean(payosReturnUrl),
                hasPayOsCancelUrl: Boolean(payosCancelUrl),
            })
        }
        // our internal reference id is echoed back via the invoice order_id
        const orderCode = this.generateOrderCode()
        const currentPhase = line.pricingPhase
        // create the invoice (retried on transient network/5xx errors)
        const invoice = await this.retryService.retry({
            action: async () => this.nowPaymentsClient.createInvoice({
                // NOWPayments charges USD dollars as price_amount in the price currency
                amount: discountedPriceUsd,
                referenceId: String(orderCode),
                description: `Course enrollment ${orderCode}`,
                successUrl: payosReturnUrl,
                cancelUrl: payosCancelUrl,
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
                    paymentType: PaymentType.Crypto,
                    // invoiceUrl is the hosted page the browser redirects to
                    checkoutUrl: invoice.invoiceUrl,
                    // store the NOWPayments invoice id so reconciliation can poll by id
                    providerPaymentId: invoice.invoiceId,
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
