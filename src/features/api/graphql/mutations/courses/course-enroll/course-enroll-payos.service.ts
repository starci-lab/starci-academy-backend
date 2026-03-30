import {
    InjectPrimaryPostgresqlEntityManager,
    PaymentType,
    PreflightTransactionEntity,
    PreflightTransactionStatus,
} from "@modules/databases"
import {
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError,
} from "@modules/exceptions"
import {
    InjectPayOS,
} from "@modules/payos"
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
    ExecutePayOsParams,
} from "./types"
import type {
    CourseEnrollResponseData,
} from "./graphql-types"
import {
    DayjsService 
} from "@modules/mixin"
import {
    envConfig 
} from "@modules/env"
import {
    CoursePricingService 
} from "./course-pricing.service"

/**
 * PayOS-specific course enrollment: payment link + preflight row.
 */
@Injectable()
export class CourseEnrollPayOsService {
    constructor(
        @InjectPrimaryPostgresqlEntityManager()
        private readonly entityManager: EntityManager,
        @InjectPayOS()
        private readonly payos: PayOS,
        private readonly dayjsService: DayjsService,
        private readonly coursePricingService: CoursePricingService,
    ) {}

    /**
     * Creates a PayOS payment link and persists a pending preflight row.
     *
     * @param param - Course context, user, resolved amount, and PayOS redirect URLs
     * @returns Checkout payload and preflight id
     */
    async execute(
        {
            course,
            user,
            payosReturnUrl,
            payosCancelUrl,
        }: ExecutePayOsParams,
    ): Promise<CourseEnrollResponseData> {
        // find the preflight transaction for the user and course
        const preflightTransaction = await this.entityManager.findOne(
            PreflightTransactionEntity,
            {
                where: {
                    userId: user.id,
                    courseId: course.id,
                },
            },
        )
        if (preflightTransaction) {
            // check the timestamp of the preflight transaction
            const timeSinceCreationMs = this.dayjsService.now().diff(
                this.dayjsService.from(preflightTransaction.createdAt),
                "milliseconds",
            )
            if (timeSinceCreationMs < envConfig().services.api.preflightTransaction.timeSinceCreationMs) {
                return {
                    checkoutUrl: preflightTransaction.checkoutUrl,
                    orderCode: String(preflightTransaction.orderCode),
                    preflightTransactionId: preflightTransaction.id,
                    paymentLinkId: preflightTransaction.paymentLinkId,
                    amount: preflightTransaction.amount,
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
        // generate description - userId + courseId
        const description = `${user.id}-${course.id}`
        // get current pricing phase
        const currentPhase = this.coursePricingService.getCurrentPricingPhase(course)
        // create payment link
        const paymentLink = await this.payos.paymentRequests.create(
            {
                amount: this.coursePricingService.resolveAmountVnd({
                    course 
                }),
                cancelUrl: payosCancelUrl,
                description,
                orderCode,
                returnUrl: payosReturnUrl,
            },
        )
        // create preflight transaction
        const row = this.entityManager.create(  
            PreflightTransactionEntity,
            {
                userId: user.id,
                courseId: course.id,
                user,
                course,
                orderCode: String(paymentLink.orderCode),
                amount: paymentLink.amount,
                pricingPhase: currentPhase,
                paymentType: PaymentType.PayOS,
                paymentLinkId: paymentLink.paymentLinkId,
                checkoutUrl: paymentLink.checkoutUrl,
                status: PreflightTransactionStatus.Pending,
            },
        )
        // save preflight transaction
        await this.entityManager.save(row)
        // return result
        return {
            checkoutUrl: paymentLink.checkoutUrl,
            orderCode: String(paymentLink.orderCode),
            preflightTransactionId: row.id,
            paymentLinkId: paymentLink.paymentLinkId,
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
