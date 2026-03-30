import {
    CourseEntity,
    EnrollmentEntity,
    InjectPrimaryPostgresqlEntityManager,
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
        @InjectPrimaryPostgresqlEntityManager()
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
        if (alreadyEnrolled) {
            throw new CourseAlreadyEnrolledError(
                {
                    courseId,
                    userId: user.id,
                },
            )
        }
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
        switch (paymentType) {
        case PaymentType.PayOS:
            return this.courseEnrollPayOsService.execute(
                {
                    course,
                    user,
                    payosReturnUrl: request.payosReturnUrl,
                    payosCancelUrl: request.payosCancelUrl,
                },
            )
        case PaymentType.Sepay:
            return this.courseEnrollSepayService.execute(
                {
                    course,
                    user,
                },
            )
        default:
            throw new BadRequestException(
                `Unsupported payment type: ${String(paymentType)}`,
            )
        }
    }
}
