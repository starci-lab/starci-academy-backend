import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases"
import {
    GqlExecutionContext
} from "@nestjs/graphql"
import {
    CourseIdRequiredException,
    EnrollmentNotFoundException,
} from "@modules/exceptions"
import {
    UserService,
} from "../user"

/**
 * The paid-only gate — enforces `is_enrolled = true` for the `x-course-id`
 * course before letting a resolver run. Backs capstone / milestone /
 * personal-project / premium mutations and queries, where a trial placeholder
 * (`is_enrolled = false`, see {@link GraphQLEnrollmentGuard}) must NOT be
 * enough. The check is delegated to {@link UserService.checkEnrollment} (the
 * cached authorization hot path); this guard adds only the header parsing and
 * the "no course id at all" rejection.
 */
@Injectable()
export class GraphQLMustEnrolledGuard implements CanActivate {
    constructor(
        private readonly userService: UserService,
    ) {}

    /**
     * Reject the request unless the caller is a paying (`is_enrolled = true`)
     * member of the `x-course-id` course.
     *
     * @param context - Execution context.
     * @returns True when the caller is enrolled.
     * @throws {CourseIdRequiredException} When no `x-course-id` header is present.
     * @throws {EnrollmentNotFoundException} When the caller is not (paid-)enrolled.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = GqlExecutionContext.create(context).getContext().req
        const user = request.user as UserEntity
        const rawCourseId = request.headers["x-course-id"]
        const courseId = Array.isArray(rawCourseId)
            ? rawCourseId[0]
            : rawCourseId
        if (!courseId) {
            throw new CourseIdRequiredException({
            })
        }
        const isEnrolled = await this.userService.checkEnrollment(
            user.id,
            courseId,
        )
        if (!isEnrolled) {
            throw new EnrollmentNotFoundException({
                userId: user.id,
                courseId,
            })
        }
        return true
    }
}
