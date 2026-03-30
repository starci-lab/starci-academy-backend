import {
    CourseEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    PaymentType,
} from "@modules/databases"
import {
    CourseAlreadyEnrolledError,
    CourseNotFoundException,
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
import {
    CourseEnrollParams,
} from "./types"
import type {
    CourseEnrollResponseData,
} from "./graphql-types"

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
        {
            request,
            user,
        }: CourseEnrollParams,
    ): Promise<CourseEnrollResponseData> {
        const {
            courseId,
            paymentType,
        } = request
        // reject duplicate enrollment before hitting payment APIs
        const alreadyEnrolled = await this.entityManager.exists(
            EnrollmentEntity,
            {
                where: {
                    courseId,
                    userId: user.id,
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
        // reject if course not found
        if (!course) {
            throw new CourseNotFoundException(
                {
                    id: courseId,
                },
            )
        }
        // delegate to the appropriate payment service
        switch (paymentType) {
        // delegate to PayOS payment service
        case PaymentType.PayOS: {
            // set default URLs if not provided
            const payosReturnUrl = request.payosReturnUrl || "https://www.google.com"
            const payosCancelUrl = request.payosCancelUrl || "https://www.google.com"
            return await this.courseEnrollPayOsService.execute(
                {
                    course,
                    user,
                    payosReturnUrl,
                    payosCancelUrl,
                },
            )
        }
        // delegate to Sepay payment service
        case PaymentType.Sepay: {
            return await this.courseEnrollSepayService.execute(
                {
                    course,
                    user,
                },
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
