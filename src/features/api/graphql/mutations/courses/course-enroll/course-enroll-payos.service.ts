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
    UserNotFoundException,
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
    CourseEnrollResponseData,
} from "./graphql-types"
import {
    DayjsService, 
    RetryService
} from "@modules/mixin"
import {
    envConfig 
} from "@modules/env"
import {
    CoursePricingService 
} from "./course-pricing.service"
import {
    ExecuteParams,
} from "../../../../types"
import {
    CourseEnrollRequest,
} from "./graphql-types"

/**
 * PayOS-specific course enrollment: payment link + preflight row.
 */
@Injectable()
export class CourseEnrollPayOsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @InjectPayOS()
        private readonly payos: PayOS,
        private readonly dayjsService: DayjsService,
        private readonly coursePricingService: CoursePricingService,
        private readonly retryService: RetryService,
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
                    userId: user.id,
                    courseId: course.id,
                    status: TransactionStatus.Pending,
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
        // create payment link
        const paymentLink = await this.retryService.retry(
            {
                action: async () => {
                    return await this.payos.paymentRequests.create(
                        {
                            amount: this.coursePricingService.resolveAmountVnd({
                                course 
                            }),
                            cancelUrl: payosCancelUrl,
                            description: "EN",
                            orderCode,
                            returnUrl: payosReturnUrl,
                        },
                    )
                },
            }
        )
        // create transaction row
        transaction = this.entityManager.create(
            TransactionEntity,
            {
                userId: user.id,
                courseId: course.id,
                user,
                course,
                referenceId: String(paymentLink.orderCode),
                amount: paymentLink.amount,
                pricingPhase: currentPhase,
                paymentType: PaymentType.PayOS,
                checkoutUrl: paymentLink.checkoutUrl,
                status: TransactionStatus.Pending,
                actionType: ActionType.Enroll,
            },
        )
        // save transaction
        await this.entityManager.save(transaction)
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
