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
    Injectable 
} from "@nestjs/common"
import type {
    EntityManager 
} from "typeorm"
import type {
    CourseEnrollResponseData 
} from "./graphql-types"
import {
    DayjsService, RetryService 
} from "@modules/mixin"
import {
    envConfig 
} from "@modules/env"
import {
    CoursePricingService 
} from "./course-pricing.service"
import {
    ExecuteParams 
} from "../../../../types"
import {
    CourseEnrollRequest 
} from "./graphql-types"

/**
 * Sepay-specific course enrollment
 */
@Injectable()
export class CourseEnrollSepayService {
    constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    private readonly entityManager: EntityManager,
    private readonly dayjsService: DayjsService,
    private readonly coursePricingService: CoursePricingService,
    private readonly retryService: RetryService,
    ) {}

    /**
   *
   * @param param - Course context, user, and request
   * @returns Checkout payload and preflight id
   */
    async execute({
        request: { courseId },
        user,
    }: ExecuteParams<CourseEnrollRequest>): Promise<CourseEnrollResponseData> {
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // find the course
        const course = await this.entityManager.findOne(CourseEntity,
            {
                where: {
                    id: courseId,
                },
                relations: {
                    pricingPhases: true,
                },
            })
        if (!course) {
            throw new CourseNotFoundException({
                id: courseId,
            })
        }
        // find the transaction for the user and course
        let transaction = await this.entityManager.findOne(TransactionEntity,
            {
                where: {
                    userId: user.id,
                    courseId: course.id,
                    status: TransactionStatus.Pending,
                },
            })
        if (transaction) {
            // check the timestamp of the transaction
            const timeSinceCreationMs = this.dayjsService
                .now()
                .diff(this.dayjsService.from(transaction.createdAt),
                    "milliseconds")
            if (
                timeSinceCreationMs <
        envConfig().services.api.transaction.timeSinceCreationMs
            ) {
                return {
                    checkoutUrl: transaction.checkoutUrl,
                    referenceId: transaction.referenceId,
                    transactionId: transaction.id,
                    amount: transaction.amount,
                }
            }
        }

        // generate order code
        const orderCode = this.generateSepayOrderCode()

        // get current pricing phase
        const currentPhase =
      this.coursePricingService.getCurrentPricingPhase(course)

        // get SePay configuration
        const sepayConfig = envConfig().services.api.sepay

        // generate payment link via SePay VietQR endpoint
        const sepayPaymentLink = await this.retryService.retry({
            action: async () => {
                const amount = this.coursePricingService.resolveAmountVnd({
                    course,
                })
                const checkoutUrl = `https://qr.sepay.vn/img?bank=${sepayConfig.bank}&acc=${sepayConfig.accountNumber}&amount=${amount}&des=${orderCode}`

                return Promise.resolve({
                    amount,
                    checkoutUrl: checkoutUrl,
                    orderCode,
                })
            },
        })

        // create transaction row
        transaction = this.entityManager.create(TransactionEntity,
            {
                user,
                course,
                referenceId: String(sepayPaymentLink.orderCode),
                amount: sepayPaymentLink.amount,
                pricingPhase: currentPhase,
                paymentType: PaymentType.Sepay,
                checkoutUrl: sepayPaymentLink.checkoutUrl,
                status: TransactionStatus.Pending,
                actionType: ActionType.Enroll,
            })
        // save transaction
        await this.entityManager.save(transaction)

        // return result
        return {
            checkoutUrl: sepayPaymentLink.checkoutUrl,
            referenceId: String(sepayPaymentLink.orderCode),
            transactionId: transaction.id,
            amount: sepayPaymentLink.amount,
        }
    }

    /**
   * Generates a unique order code for Sepay payment requests.
   *
   * @returns Integer order code safe for Sepay API.
   */
    private generateSepayOrderCode(): number {
        return Date.now() * 1000 + Math.floor(Math.random() * 1000)
    }
}
