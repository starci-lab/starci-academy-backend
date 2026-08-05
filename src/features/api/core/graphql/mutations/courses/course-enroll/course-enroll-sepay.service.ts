import {
    ActionType,
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    PaymentType,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    CourseNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    CourseEnrollResponseData,
} from "./graphql-types"
import {
    DayjsService,
} from "@modules/mixin"
import {
    envConfig,
} from "@modules/env"
import {
    InjectSepay,
} from "@modules/sepay"
import {
    SePayPgClient,
} from "sepay-pg-node"
import {
    CoursePricingService,
} from "./course-pricing.service"
import {
    ExecuteParams,
} from "../../../../types"
import {
    CourseEnrollRequest,
} from "./graphql-types"
import type {
    SignSepayFieldsParams,
} from "./types"
import {
    EnqueueReconcileTransactionJobService,
    InstallmentPlanService,
    LoyaltyDiscountService,
    VoucherService,
} from "@modules/bussiness"

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
        private readonly coursePricingService: CoursePricingService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly loyaltyDiscountService: LoyaltyDiscountService,
        private readonly voucherService: VoucherService,
        private readonly installmentPlanService: InstallmentPlanService,
    ) {}

    /**
     * @param param - Course context, user, and request
     * @returns Checkout payload (form action URL + signed fields) and preflight id
     */
    async execute({
        request: {
            courseId,
            payosReturnUrl,
            payosCancelUrl,
            voucherCode,
            installmentMonths,
        },
        user,
    }: ExecuteParams<CourseEnrollRequest>): Promise<CourseEnrollResponseData> {
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // find the course
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
        // loyalty discount applied at checkout (so charged === shown)
        const {
            percent: discountPercent,
        } = await this.loyaltyDiscountService.computeLoyaltyDiscount({
            userId: user.id,
        })
        const loyaltyAmount = this.coursePricingService.resolveAmountVnd({
            course,
            discountPercent,
        })

        // reuse a still-fresh pending transaction (regenerate signed fields) -- a
        // voucher on a reused transaction is NOT re-evaluated (it was already
        // reserved/priced when that transaction was first created)
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

        // an invalid code throws HERE (before any row is written) -- a valid one
        // further discounts the loyalty-discounted amount
        const discountedAmount = voucherCode
            ? this.voucherService.applyToAmount(
                loyaltyAmount,
                await this.voucherService.previewDiscount({
                    userId: user.id,
                    code: voucherCode,
                    courseId: course.id,
                }),
            )
            : loyaltyAmount
        // installment : charge only the FIRST cycle now (monthly), snapshot
        // the whole-schedule intent onto the Enroll transaction so the enroll worker
        // creates the Fixed plan on payment success (§2.2). One-shot = full amount.
        const installment = installmentMonths
            ? this.installmentPlanService.computeInstallmentTotal(discountedAmount,
                installmentMonths)
            : null
        const amount = installment ? installment.monthlyAmountVnd : discountedAmount

        // sign a fresh order + persist the pending transaction + (if given) RESERVE
        // the voucher in the SAME db transaction, so a concurrent second checkout
        // can never also claim the same code
        const orderCode = this.generateSepayOrderCode()
        const currentPhase = this.coursePricingService.getCurrentPricingPhase(course)
        const checkoutFields = this.signFields({
            orderCode,
            amount,
            successUrl: payosReturnUrl,
            cancelUrl: payosCancelUrl,
        })
        const transaction = await this.entityManager.transaction(async (manager) => {
            const created = manager.create(
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
            const saved = await manager.save(created)
            if (voucherCode) {
                // re-validate + reserve UNDER LOCK -- the earlier previewDiscount() was
                // advisory only (no lock held), so a race since then is still caught here
                await this.voucherService.reserve({
                    entityManager: manager,
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
        return Date.now() * 1000 + Math.floor(Math.random() * 1000)
    }
}
