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
    UserService,
} from "@modules/bussiness"

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
     * @param userService - The user service.
     */
    constructor(
        private readonly userService: UserService,
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

        const isEnrolled = await this.userService.checkEnrollment(
            user.id,
            courseId,
        )
        return {
            isEnrolled,
        }
    }
}
