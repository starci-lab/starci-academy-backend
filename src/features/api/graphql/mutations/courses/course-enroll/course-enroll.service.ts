import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    PaymentType,
} from "@modules/databases"
import {
    CourseAlreadyEnrolledError,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    BadRequestException,
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseEnrollPayOsService,
} from "./course-enroll-payos.service"
import {
    CourseEnrollSepayService,
} from "./course-enroll-sepay.service"
import type {
    CourseEnrollRequest,
    CourseEnrollResponseData,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../types"

/**
 * Orchestrates course enrollment checkout: validation, pricing (VND), then PayOS or Sepay service.
 */
@Injectable()
export class CourseEnrollService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly courseEnrollPayOsService: CourseEnrollPayOsService,
        private readonly courseEnrollSepayService: CourseEnrollSepayService,
    ) {}

    /**
     * Validates user and course, then delegates.
     *
     * @param param - GraphQL request and authenticated user
     * @returns Checkout payload and preflight transaction id
     */
    async execute(
        params: ExecuteParams<CourseEnrollRequest>,
    ): Promise<CourseEnrollResponseData> {
        const {
            request,
            user,
        } = params
        if (!user) {
            throw new UserNotFoundException(
                {
                }
            )
        }
        const {
            courseId,
            paymentType,
        } = request
        // reject duplicate enrollment before hitting payment APIs
        const alreadyEnrolled = await this.entityManager.exists(
            EnrollmentEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        // reject duplicate enrollment before hitting payment APIs
        if (alreadyEnrolled) {
            throw new CourseAlreadyEnrolledError(
                {
                    courseId,
                    userId: user.id,
                },
            )
        }
        // delegate to the appropriate payment service
        console.log(paymentType);
        switch (paymentType) {
        // delegate to PayOS payment service
        case PaymentType.PayOS: {

            return await this.courseEnrollPayOsService.execute(
                params,
            )
        }
        // delegate to Sepay payment service
        case PaymentType.Sepay: {
            return await this.courseEnrollSepayService.execute(
                params
            )
        }
        // reject if payment type is not supported
        default:
            throw new BadRequestException(
                `Unsupported payment type: ${String(paymentType)}`,
            )
        }
    }
}
