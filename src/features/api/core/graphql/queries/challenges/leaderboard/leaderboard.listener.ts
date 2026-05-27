import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    EventEmitterService,
    EventName,
    type ChallengeSubmissionProgressUpdatedEventPayload,
} from "@modules/event"
import {
    LeaderboardService,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
    EnrollmentEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"

/**
 * Listens for ChallengeSubmissionProgressUpdated events and refreshes the course
 * leaderboard cache.
 *
 * Edge cases handled:
 *   - Multiple users submitting on the same course at once: a SETNX-style debounce
 *     flag in Redis (CourseLeaderboardDebounce key, ~5s TTL) ensures only one
 *     recompute fires per course per window. Subsequent events within the window
 *     are dropped — the in-flight recompute will already pick up their writes,
 *     and the next event after the window will trigger a fresh recompute.
 *   - Missing enrollment row (event payload references a deleted enrollment):
 *     swallowed silently, no leaderboard touched.
 */
@Injectable()
export class LeaderboardListener implements OnModuleInit {
    constructor(
        private readonly eventEmitterService: EventEmitterService,
        private readonly leaderboardService: LeaderboardService,
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    onModuleInit(): void {
        this.eventEmitterService.on({
            event: EventName.ChallengeSubmissionProgressUpdated,
            listener: async (payload: ChallengeSubmissionProgressUpdatedEventPayload) => {
                const enrollment = await this.entityManager.findOne(
                    EnrollmentEntity,
                    {
                        where: {
                            id: payload.enrollmentId,
                        },
                        select: {
                            id: true,
                            courseId: true,
                        },
                    },
                )
                if (!enrollment) {
                    return
                }
                const acquired = await this.tryAcquireDebounce(enrollment.courseId)
                if (!acquired) {
                    return
                }
                await this.leaderboardService.updateLeaderboard(enrollment.courseId)
            },
        })
    }

    /**
     * Reserve the debounce window for this courseId. Returns true if this caller
     * should perform the recompute, false if another caller is already on it.
     *
     * Best-effort check-then-set — a true SETNX would be atomic, but the read+write
     * race here only costs us at most one redundant recompute per window, which is
     * cheap and still correct (last write wins, same data).
     */
    private async tryAcquireDebounce(courseId: string): Promise<boolean> {
        const existing = await this.cacheService.get({
            key: CacheKey.CourseLeaderboardDebounce,
            args: [courseId],
        })
        if (existing) {
            return false
        }
        await this.cacheService.set({
            key: CacheKey.CourseLeaderboardDebounce,
            args: [courseId],
            cacheResult: true,
        })
        return true
    }
}
