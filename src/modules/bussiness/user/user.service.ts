import {
    Injectable 
} from "@nestjs/common"
import {
    EntityManager 
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
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
     * Check whether a user is enrolled in a course (authorization hot path).
     *
     * Membership is cached as ONE set per user (`UserEnrolledCourses`), not per
     * (user, course) pair: the whole set of enrolled course ids is loaded once
     * with a single indexed query and every later check is an in-memory
     * `includes`. The set is dropped on any enrollment change via
     * {@link invalidateEnrolledCourses} (enroll / refund), so a freshly bought
     * course shows up immediately and a refunded one loses access — no stale
     * per-pair `true`/`false` lingering for the (long) TTL.
     *
     * @param userId - The ID of the user.
     * @param courseId - The ID of the course.
     * @returns True if the user is enrolled in the course, false otherwise.
     */
    async checkEnrollment(
        userId: string,
        courseId: string,
    ): Promise<boolean> {
        // one cache entry per user holds every course id they are enrolled in
        const cachedCourseIds = await this.cacheService.get({
            key: CacheKey.UserEnrolledCourses,
            args: [
                userId,
            ],
        })
        if (cachedCourseIds !== undefined) {
            // O(1)-ish membership check against the cached set — no DB round-trip
            return cachedCourseIds.includes(courseId)
        }

        // cache miss → rebuild the whole set with a single indexed read on
        // (user_id) — course_id is a virtual @RelationId so query the column directly
        const rows = await this.entityManager.query<Array<{ course_id: string }>>(
            "SELECT course_id FROM enrollments WHERE user_id = $1",
            [
                userId,
            ],
        )
        const courseIds = rows.map((row) => row.course_id)
        // cache the rebuilt set (TTL is a safety net; del-on-write keeps it correct)
        await this.cacheService.set({
            key: CacheKey.UserEnrolledCourses,
            args: [
                userId,
            ],
            cacheResult: courseIds,
        })
        return courseIds.includes(courseId)
    }

    /**
     * Drop a user's cached enrolled-courses set so the next check rebuilds it
     * from the source. Call this AFTER any enrollment change commits (enroll /
     * refund / unenroll) — it is the single invalidation point that keeps the
     * authorization cache from going stale.
     *
     * @param userId - The user whose enrollment set to invalidate.
     */
    async invalidateEnrolledCourses(userId: string): Promise<void> {
        // a single DEL per user (no per-pair keys to track down)
        await this.cacheService.del({
            key: CacheKey.UserEnrolledCourses,
            args: [
                userId,
            ],
        })
    }
}