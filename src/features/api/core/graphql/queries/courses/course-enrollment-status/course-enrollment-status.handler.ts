import {
    ICQRSHandler
} from "@modules/cqrs"
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
import {
    CourseEnrollmentStatusQuery,
} from "./course-enrollment-status.query"
import type {
    CourseEnrollmentStatusData,
} from "./graphql-types"
import {
    InjectPrimaryPostgreSQLEntityManager,
    EnrollmentEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"

/**
 * Handler for the course enrollment status query.
 */
@QueryHandler(CourseEnrollmentStatusQuery)
@Injectable()
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

        return {
            isEnrolled: !!enrollment,
            enrollment: enrollment ?? null,
        }
    }
}

