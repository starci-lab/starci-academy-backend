import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    UserService,
} from "../user/user.service"

@Injectable()
/**
 * Resolves the caller's enrollment for the `x-course-id` course -- creating a
 * TRIAL placeholder (`is_enrolled = false`) when none exists yet -- and injects
 * `enrollmentId` (and the `enrollment`) onto the GraphQL request. In the
 * enrollment-centric model, course-scoped resolvers/handlers read
 * `req.enrollmentId` instead of `req.user.id`, so all per-course progress is
 * keyed by enrollment.
 *
 * Permissive by design: it ESTABLISHES the enrollment context, it does NOT
 * enforce paid membership. Paid-only surfaces (capstone / milestone /
 * personal-project / premium) keep using {@link GraphQLMustEnrolledGuard}, which
 * checks `is_enrolled = true`.
 */
export class GraphQLEnrollmentGuard implements CanActivate {
    constructor(
        private readonly userService: UserService,
    ) {}

    /**
     * Resolve-or-create the enrollment and stash it on the request.
     *
     * @param context - Execution context.
     * @returns Always true (context provider, not an enforcer).
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = GqlExecutionContext.create(context).getContext().req
        const user = request.user as UserEntity
        const rawCourseId = request.headers["x-course-id"]
        const courseId = Array.isArray(rawCourseId)
            ? rawCourseId[0]
            : rawCourseId
        // Permissive: no course context on the request -> do nothing. These
        // course-scoped handlers self-resolve the enrollment from the entity's own
        // course (via resolveOrCreateTrialEnrollment), so a missing `x-course-id`
        // header must NOT 400 them. When present, we pre-resolve + inject it.
        if (!courseId) {
            return true
        }
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            user.id,
            courseId,
        )
        // course-scoped handlers key progress by enrollment, not user
        request.enrollment = enrollment
        request.enrollmentId = enrollment.id
        return true
    }
}
