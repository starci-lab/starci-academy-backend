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
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError,
} from "@modules/platform/exceptions/errors/courses/payos-return-url-and-payos-cancel-url-must-be-required"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    InjectPayOS,
} from "@modules/integrations/payos/payos.providers"
import {
    Injectable,
} from "@nestjs/common"
import {
    PayOS,
} from "@payos/node"
import type {
    EntityManager,
} from "typeorm"
import type {
    CourseEnrollResponseData,
} from "./graphql-types/response"
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
    CoursePricingService 
} from "./course-pricing.service"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CourseEnrollRequest,
} from "./graphql-types/request"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
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
 * PayOS-specific course enrollment: payment link + preflight row.
 *
 * A domestic VND gateway -- honours BOTH `request.voucherCode` discount types
 * (Percent and Flat) per `PAYMENT_MODIFIER_CAPABILITY`. See
 * {@link CourseEnrollSepayService} for the shared pattern (preview -> reserve
 * inside the same insert transaction -> persist the code).
 */
export class CourseEnrollPayOsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectPayOS()
        private readonly payos: PayOS,
        private readonly dayjsService: DayjsService,
        private readonly coursePricingService: CoursePricingService,
        private readonly retryService: RetryService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
        private readonly loyaltyDiscountService: LoyaltyDiscountService,
        private readonly voucherService: VoucherService,
        private readonly installmentPlanService: InstallmentPlanService,
    ) {}

    /**
     * Creates a PayOS payment link and persists a pending preflight row.
     *
     * @param param - Course context, user, resolved amount, and PayOS redirect URLs
     * @returns Checkout payload and preflight id
     */
    async execute(
        {
            request: {
                courseId,
                payosReturnUrl,
                payosCancelUrl,
                voucherCode,
                installmentMonths,
            },
            user,
        }: ExecuteParams<CourseEnrollRequest>,
    ): Promise<CourseEnrollResponseData> {
        if (!user) {
            throw new UserNotFoundException(
                {
                }
            )
        }
        // find the course
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id: courseId,
                },
                relations: {
                    metadata: true,
                    pricingPhases: true,
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException(
                {
                    id: courseId,
                },
            )
        }
        // find the transaction for the user and course
        let transaction = await this.entityManager.findOne(
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
                    paymentType: PaymentType.PayOS,
                },
            },
        )
        if (transaction) {
            // check the timestamp of the transaction
            const timeSinceCreationMs = this.dayjsService.now().diff(
                this.dayjsService.from(transaction.createdAt),
                "milliseconds",
            )
            if (timeSinceCreationMs < envConfig().services.api.transaction.timeSinceCreationMs) {
                return {
                    checkoutUrl: transaction.checkoutUrl,
                    referenceId: transaction.referenceId,
                    transactionId: transaction.id,
                    amount: transaction.amount,
                }
            }
        }
        // validate required URLs
        if (!payosReturnUrl || !payosCancelUrl) {
            throw new PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError(
                {
                    hasPayOsReturnUrl: Boolean(payosReturnUrl),
                    hasPayOsCancelUrl: Boolean(payosCancelUrl),
                },
            )
        }
        // generate order code
        const orderCode = this.generatePayOsOrderCode()

        // get current pricing phase
        const currentPhase = this.coursePricingService.getCurrentPricingPhase(course)
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
        // an invalid code throws HERE (before the PayOS link is created) -- a
        // valid one further discounts the loyalty-discounted amount
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
        // the whole-schedule intent (months/markup/total) onto the Enroll transaction
        // so the enroll worker creates the Fixed plan on payment success (§2.2). A
        // one-shot purchase (no installmentMonths) charges the full discounted amount.
        const installment = installmentMonths
            ? this.installmentPlanService.computeInstallmentTotal(discountedAmount,
                installmentMonths)
            : null
        const amount = installment ? installment.monthlyAmountVnd : discountedAmount
        // create payment link
        const paymentLink = await this.retryService.retry(
            {
                action: async () => {
                    return await this.payos.paymentRequests.create(
                        {
                            amount,
                            cancelUrl: payosCancelUrl,
                            description: "EN",
                            orderCode,
                            returnUrl: payosReturnUrl,
                        },
                    )
                },
            }
        )
        // create the pending transaction + (if given) RESERVE the voucher in the
        // SAME db transaction, so a concurrent second checkout can never also
        // claim the same code
        transaction = await this.entityManager.transaction(async (manager) => {
            const created = manager.create(
                TransactionEntity,
                {
                    user,
                    course,
                    referenceId: String(paymentLink.orderCode),
                    amount: paymentLink.amount,
                    discountPercent,
                    voucherCode: voucherCode ?? null,
                    pricingPhase: currentPhase,
                    paymentType: PaymentType.PayOS,
                    checkoutUrl: paymentLink.checkoutUrl,
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
        // return result
        return {
            checkoutUrl: paymentLink.checkoutUrl,
            referenceId: String(paymentLink.orderCode),
            transactionId: transaction.id,
            amount: paymentLink.amount,
        }
    }
    /**
     * Generates a unique order code for PayOS payment requests.
     *
     * @returns Integer order code safe for PayOS API.
     */
    private generatePayOsOrderCode(): number {
        return Date.now() * 1000 + Math.floor(
            Math.random() * 1000,
        )
    }
}
