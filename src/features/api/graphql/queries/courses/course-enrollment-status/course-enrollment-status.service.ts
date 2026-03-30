import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    CourseEnrollmentStatusData,
    CourseEnrollmentStatusRequest,
} from "./graphql-types"

/**
 * Loads enrollment aggregate for a course and whether a user is enrolled.
 */
@Injectable()
export class CourseEnrollmentStatusService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * @param courseId - Course id
     * @param userId - Local user id when authenticated; omit when anonymous
     */
    async execute(
        {
            courseId,
        }: CourseEnrollmentStatusRequest,
        user: UserEntity,
    ): Promise<CourseEnrollmentStatusData> {
        const enrollmentCount = await this.entityManager.count(
            EnrollmentEntity,
            {
                where: {
                    courseId,
                },
            },
        )
        let isEnrolled = false
        if (user.id) {
            isEnrolled = await this.entityManager.exists(
                EnrollmentEntity,
                {
                    where: {
                        courseId,
                        userId: user.id,
                    },
                },
            )
        }
        return {
            enrollmentCount,
            isEnrolled,
        }
    }
}
