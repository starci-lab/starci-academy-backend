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
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    CourseEnrollResponseData,
} from "./graphql-types/response"
import {
    withCheckoutAdvisoryLock,
} from "./checkout-advisory-lock"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    InjectSepay,
} from "@modules/integrations/sepay/sepay.providers"
import {
    SePayPgClient,
} from "sepay-pg-node"
import type {
    CoursePriceQuoteResult,
} from "@modules/bussiness/course-pricing/types"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CourseEnrollRequest,
} from "./graphql-types/request"
import type {
    SignSepayFieldsParams,
} from "./types/sepay-checkout"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    generateOrderCode,
} from "@modules/bussiness/transactions/utils/order-code"

@Injectable()
/**
 * Sepay-specific course enrollment via the SePay Payment Gateway. Signs the
 * order fields (form-POST checkout) and persists a pending preflight row.
 *
 * A domestic VND gateway -- honours BOTH `request.voucherCode` discount types
 * (Percent and Flat) per `PAYMENT_MODIFIER_CAPABILITY`, using the 3-step
 * pattern (preview -> reserve inside the same insert transaction -> persist the
 * code) every gateway now follows. PayOS mirrors this pattern; the USD
 * gateways (Stripe/PayPal/Crypto) follow the same pattern but only for
 * Percent (Flat is rejected before dispatch -- see course-enroll.handler.ts).
 */
export class CourseEnrollSepayService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectSepay()
        private readonly sepay: SePayPgClient,
        private readonly dayjsService: DayjsService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly voucherService: VoucherService,
    ) {}

    /**
     * @param param - Course context, user, and request
     * @returns Checkout payload (form action URL + signed fields) and preflight id
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
                : `checkout:course:${params.user.id}:${params.request.courseId}:${PaymentType.Sepay}`,
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
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // find the course
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
        const line = quote.lines[0]
        const discountPercent = line.displayDiscountPercent

        // reuse a still-fresh pending transaction (regenerate signed fields) -- a
        // voucher on a reused transaction is NOT re-evaluated (it was already
        // reserved/priced when that transaction was first created)
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
                    paymentType: PaymentType.Sepay,
                },
            },
        )
        if (existing && this.isReusable(existing)) {
            return {
                checkoutUrl: this.sepay.checkout.initCheckoutUrl(),
                referenceId: existing.referenceId,
                transactionId: existing.id,
                amount: existing.amount,
                checkoutFields: this.signFields({
                    orderCode: Number(existing.referenceId),
                    amount: existing.amount,
                    successUrl: payosReturnUrl,
                    cancelUrl: payosCancelUrl,
                }),
            }
        }

        const installment = quote.selectedInstallment
        const amount = installment ? installment.monthlyAmountVnd : quote.totalChargedVnd

        // sign a fresh order + persist the pending transaction + (if given) RESERVE
        // the voucher in the SAME db transaction, so a concurrent second checkout
        // can never also claim the same code
        const orderCode = this.generateSepayOrderCode()
        const currentPhase = line.pricingPhase
        const checkoutFields = this.signFields({
            orderCode,
            amount,
            successUrl: payosReturnUrl,
            cancelUrl: payosCancelUrl,
        })
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
                    paymentType: PaymentType.Sepay,
                    checkoutUrl: this.sepay.checkout.initCheckoutUrl(),
                    status: TransactionStatus.Pending,
                    actionType: ActionType.Enroll,
                    installmentMonths: installment ? installment.months : null,
                    installmentMarkupPercent: installment ? installment.markupPercent : null,
                    installmentTotalVnd: installment ? installment.totalAmountVnd : null,
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

        return {
            checkoutUrl: this.sepay.checkout.initCheckoutUrl(),
            referenceId: String(orderCode),
            transactionId: transaction.id,
            amount,
            checkoutFields,
        }
    }

    /**
     * Whether a pending transaction is recent enough to hand back.
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
     * Sign SePay PG one-time-payment fields and return them JSON-encoded for the
     * client to POST as a form. Pure local HMAC signing -- no side effects.
     */
    private signFields({
        orderCode,
        amount,
        successUrl,
        cancelUrl,
    }: SignSepayFieldsParams): string {
        const fields = this.sepay.checkout.initOneTimePaymentFields({
            operation: "PURCHASE",
            order_invoice_number: String(orderCode),
            order_amount: amount,
            currency: "VND",
            order_description: `Course enrollment ${orderCode}`,
            success_url: successUrl,
            cancel_url: cancelUrl,
            error_url: cancelUrl,
        })
        return JSON.stringify(fields)
    }

    /**
     * Generates a unique order code for SePay payment requests.
     *
     * @returns Integer order code.
     */
    private generateSepayOrderCode(): number {
        return generateOrderCode()
    }
}
