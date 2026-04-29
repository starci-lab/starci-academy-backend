import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    EnrollmentEntity,
} from "@modules/databases"
import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases"
import {
    EntityManager 
} from "typeorm"
import {
    GqlExecutionContext 
} from "@nestjs/graphql"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"

/**
 * Guard that checks if the user is enrolled in the course.
 */ 
@Injectable()
export class GraphQLMustEnrolledGuard implements CanActivate {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
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
            throw new BadRequestException("Course ID is required")
        }
        const cachedEnrollment = await this.cacheService.get({
            key: CacheKey.CourseEnrollment,
            args: [
                user.id,
                courseId,
            ],
        })
        if (cachedEnrollment !== undefined) {
            return cachedEnrollment
        }
        // Check if the user is enrolled in the course
        const exists = await this.entityManager.exists(
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
        await this.cacheService.set({
            key: CacheKey.CourseEnrollment,
            args: [
                user.id,
                courseId,
            ],
            cacheResult: exists,
        })
        // Return true if the user is enrolled in the course, false otherwise
        return exists
    }
}
