import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    EffectiveLearnerAccessService,
} from "../pro-subscription/effective-learner-access.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    GqlExecutionContext
} from "@nestjs/graphql"
import {
    EnrollmentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/enrollment-not-found"
import {
    CourseIdRequiredException,
} from "@modules/platform/exceptions/errors/guards/course-id-required"

@Injectable()
/**
 * The paid-only gate for the `x-course-id` course. Backs capstone / milestone /
 * personal-project / premium mutations and queries. Access is centralized in
 * {@link EffectiveLearnerAccessService}: active Pro or factual paid enrollment
 * is enough, while a trial placeholder alone remains insufficient.
 */
export class GraphQLMustEnrolledGuard implements CanActivate {
    constructor(
        private readonly effectiveLearnerAccessService: EffectiveLearnerAccessService,
    ) {}

    /**
     * Reject unless the caller has active Pro or a factual paid enrollment.
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
        const hasAccess = await this.effectiveLearnerAccessService.hasCourseAccess(
            user.id,
            courseId,
        )
        if (!hasAccess) {
            throw new EnrollmentNotFoundException({
                userId: user.id,
                courseId,
            })
        }
        return true
    }
}
