import {
    Injectable 
} from "@nestjs/common"
import {
    EntityManager 
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager, 
    EnrollmentEntity,
    UserEntity
} from "@modules/databases"
import {
    CacheKey,
    CacheService 
} from "@modules/cache"
import {
    UserNotFoundException 
} from "@modules/exceptions"

/**
 * Service for managing users.
 */
@Injectable()
export class UserService {
    constructor(
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Get user by user ID from Keycloak
     */
    async getUserByKeycloakId(
        keycloakId: string
    ): Promise<UserEntity> {
        /**
         * Get user from cache
         */
        let user = await this.cacheService.get(
            {
                key: CacheKey.KeycloakUser,
                args: [keycloakId],
            }
        )
        if (!user) {
            /**
             * Get user from database
             */
            user = await this.entityManager.findOne(
                UserEntity,
                {
                    select: {
                        id: true,
                    },
                    where: {
                        keycloakId 
                    },
                }
            ) ?? undefined
            if (!user) {
                throw new UserNotFoundException({
                    keycloakId 
                })
            }
            /**
             * Set user in cache
             */
            await this.cacheService.set(
                {
                    key: CacheKey.KeycloakUser,
                    args: [keycloakId],
                    cacheResult: user,
                }
            )
        }
        /**
         * Return user
         */
        return user as UserEntity
    }

    /**
     * Check if a user is enrolled in a course.
     * @param userId - The ID of the user.
     * @param courseId - The ID of the course.
     * @returns True if the user is enrolled in the course, false otherwise.
     */
    async checkEnrollment(
        userId: string,
        courseId: string
    ): Promise<boolean> {
        const cachedEnrollment = await this.cacheService.get(
            {
                key: CacheKey.CourseEnrollment,
                args: [
                    userId,
                    courseId,
                ],
            },
        )
        if (cachedEnrollment !== undefined) {
            return cachedEnrollment
        }

        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    course: {
                        id: courseId,
                    },
                },
            }
        )
        // TypeORM `findOne` returns `null` (not `undefined`) when no row matches — comparing against
        // `undefined` made this always true, so every viewer was treated as enrolled.
        const isEnrolled = enrollment !== null
        await this.cacheService.set(
            {
                key: CacheKey.CourseEnrollment,
                args: [
                    userId,
                    courseId,
                ],
                cacheResult: isEnrolled,
            },
        )
        return isEnrolled
    }
}