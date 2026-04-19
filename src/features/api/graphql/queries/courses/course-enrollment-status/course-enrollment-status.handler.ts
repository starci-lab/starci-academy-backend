import {
    ICQRSHandler,
} from "@modules/bussiness"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseEnrollmentStatusQuery,
} from "./course-enrollment-status.query"
import type {
    CourseEnrollmentStatusData,
} from "./graphql-types"

@QueryHandler(CourseEnrollmentStatusQuery)
@Injectable()
export class CourseEnrollmentStatusHandler
    extends ICQRSHandler<CourseEnrollmentStatusQuery, CourseEnrollmentStatusData>
    implements IQueryHandler<CourseEnrollmentStatusQuery, CourseEnrollmentStatusData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: CourseEnrollmentStatusQuery,
    ): Promise<CourseEnrollmentStatusData> {
        const {
            request,
            user,
        } = query.params

        if (!user) {
            throw new UserNotFoundException({})
        }

        const {
            courseId,
        } = request

        const enrollmentCount = await this.entityManager.count(
            EnrollmentEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                },
            },
        )
        const isEnrolled = await this.entityManager.exists(
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
        return {
            enrollmentCount,
            isEnrolled,
        }
    }
}
