import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
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
import {
    ExecuteParams,
} from "../../../../types"
import {
    UserNotFoundException,
} from "@modules/exceptions"

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
            request,
            user,
        }: ExecuteParams<CourseEnrollmentStatusRequest>,
    ): Promise<CourseEnrollmentStatusData> {
        if (!user) {
            throw new UserNotFoundException(
                {
                }
            )
        }
        const {
            courseId,
        } = request
        const enrollmentCount = await this.entityManager.count(
            EnrollmentEntity,
            {
                where: {
                    courseId,
                },
            },
        )
        const isEnrolled = await this.entityManager.exists(
            EnrollmentEntity,
            {
                where: {
                    courseId,
                    userId: user.id,
                },
            },
        )
        return {
            enrollmentCount,
            isEnrolled,
        }
    }
}
