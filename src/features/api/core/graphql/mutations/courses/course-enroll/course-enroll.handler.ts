import {
    ICQRSHandler
} from "@modules/cqrs"
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
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseEnrollCommand,
} from "./course-enroll.command"
import {
    CourseEnrollPayOsService,
} from "./course-enroll-payos.service"
import {
    CourseEnrollSepayService,
} from "./course-enroll-sepay.service"
import {
    CourseEnrollResponseData,
} from "./graphql-types"

@CommandHandler(CourseEnrollCommand)
@Injectable()
export class CourseEnrollHandler
    extends ICQRSHandler<CourseEnrollCommand, CourseEnrollResponseData>
    implements ICommandHandler<CourseEnrollCommand, CourseEnrollResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly courseEnrollPayOsService: CourseEnrollPayOsService,
        private readonly courseEnrollSepayService: CourseEnrollSepayService,
    ) {
        super()
    }

    protected override async process(
        command: CourseEnrollCommand,
    ): Promise<CourseEnrollResponseData> {
        const params = command.params
        const {
            request,
            user,
        } = params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const {
            courseId,
            paymentType,
        } = request

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
        if (alreadyEnrolled) {
            throw new CourseAlreadyEnrolledError({
                courseId,
                userId: user.id,
            })
        }

        switch (paymentType) {
        case PaymentType.PayOS: {
            return this.courseEnrollPayOsService.execute(params)
        }
        case PaymentType.Sepay: {
            return this.courseEnrollSepayService.execute(params)
        }
        default:
            throw new BadRequestException(
                `Unsupported payment type: ${String(paymentType)}`,
            )
        }
    }
}
