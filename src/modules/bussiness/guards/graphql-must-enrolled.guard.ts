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
 * Guard that checks if the user is enrolled in the course.
 */ 
@Injectable()
export class GraphQLMustEnrolledGuard implements CanActivate {
    constructor(
        private readonly userService: UserService,
    ) {}

    /**
     * Can activate.
     * @param context - Execution context.
     * @returns Promise of boolean.
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
