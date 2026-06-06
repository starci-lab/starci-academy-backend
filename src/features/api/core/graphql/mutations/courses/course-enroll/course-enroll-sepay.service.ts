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
} from "@modules/bussiness"

/**
 * Sepay-specific course enrollment via the SePay Payment Gateway. Signs the
 * order fields (form-POST checkout) and persists a pending preflight row.
 */
@Injectable()
export class CourseEnrollSepayService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectSepay()
        private readonly sepay: SePayPgClient,
        private readonly dayjsService: DayjsService,
        private readonly coursePricingService: CoursePricingService,
        private readonly enqueueReconcileTransactionJobService: EnqueueReconcileTransactionJobService,
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
        const amount = this.coursePricingService.resolveAmountVnd({
            course,
        })

        // reuse a still-fresh pending transaction (regenerate signed fields)
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

        // sign a fresh order + persist the pending transaction
        const orderCode = this.generateSepayOrderCode()
        const currentPhase = this.coursePricingService.getCurrentPricingPhase(course)
        const checkoutFields = this.signFields({
            orderCode,
            amount,
            successUrl: payosReturnUrl,
            cancelUrl: payosCancelUrl,
        })
        const transaction = this.entityManager.create(
            TransactionEntity,
            {
                user,
                course,
                referenceId: String(orderCode),
                amount,
                pricingPhase: currentPhase,
                paymentType: PaymentType.Sepay,
                checkoutUrl: this.sepay.checkout.initCheckoutUrl(),
                status: TransactionStatus.Pending,
                actionType: ActionType.Enroll,
            },
        )
        await this.entityManager.save(transaction)
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
     * client to POST as a form. Pure local HMAC signing — no side effects.
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
