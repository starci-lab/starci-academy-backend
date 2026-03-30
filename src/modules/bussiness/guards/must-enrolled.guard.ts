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

/**
 * Guard that checks if the user is enrolled in the course.
 */ 
@Injectable()
export class MustEnrolledGuard implements CanActivate {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Can activate.
     * @param context - Execution context.
     * @returns Promise of boolean.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const user = request.user as UserEntity
        const courseId = request.body.courseId
        if (!courseId) {
            throw new BadRequestException("Course ID is required")
        }
        // Check if the user is enrolled in the course
        const exists = await this.entityManager.exists(
            EnrollmentEntity,
            {
                where: {
                    userId: user.id,
                    courseId: courseId,
                },
            },
        )
        // Return true if the user is enrolled in the course, false otherwise
        return exists
    }
}
