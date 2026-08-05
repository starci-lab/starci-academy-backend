import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    CourseEnrollmentStatusQuery,
} from "./course-enrollment-status.query"
import type {
    CourseEnrollmentStatusData,
} from "./graphql-types/response"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EntityManager,
} from "typeorm"

@QueryHandler(CourseEnrollmentStatusQuery)
@Injectable()
/**
 * Handler for the course enrollment status query.
 */
export class CourseEnrollmentStatusHandler
    extends ICQRSHandler<CourseEnrollmentStatusQuery, CourseEnrollmentStatusData>
    implements IQueryHandler<CourseEnrollmentStatusQuery, CourseEnrollmentStatusData> {
        
    /**
     * Constructor.
     * @param entityManager - The primary PostgreSQL entity manager.
     */
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Processes the course enrollment status query.
     * @param query - The query.
     * @returns The course enrollment status data.
     */
    protected override async process(
        query: CourseEnrollmentStatusQuery,
    ): Promise<CourseEnrollmentStatusData> {
        const {
            request,
            user,
        } = query.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const {
            courseId,
        } = request

        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: courseId,
                    },
                },
            },
        )

        // `isEnrolled` reflects the REAL-enrollment flag, not mere row existence: a
        // trial/preview row (is_enrolled = false) reports false so the FE still shows
        // the enroll / buy CTA. No row -> false as before.
        return {
            isEnrolled: enrollment?.isEnrolled ?? false,
            enrollment: enrollment ?? null,
        }
    }
}

