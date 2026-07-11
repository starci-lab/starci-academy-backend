import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    NotificationType,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    writeXpHistory,
} from "@features/api/processors/ai/shared/xp"
import {
    NotificationService,
} from "../notification"
import {
    UserStatsProjectionService,
} from "../projections/user-stats/user-stats-projection.service"

/** One platform-wide streak length that grants a one-time Coin bonus. */
export interface StreakMilestone {
    /** Consecutive-day streak length that unlocks the bonus. */
    readonly days: number
    /** Coin credited exactly once when the milestone is first reached. */
    readonly coin: number
}

/**
 * Platform-wide streak milestones (7/30/100 consecutive days), ordered
 * ascending. Each is granted exactly once per user — see {@link
 * StreakMilestoneService.checkAndGrant}.
 */
export const STREAK_MILESTONES: ReadonlyArray<StreakMilestone> = [
    {
        days: 7,
        coin: 30,
    },
    {
        days: 30,
        coin: 100,
    },
    {
        days: 100,
        coin: 300,
    },
]

/**
 * Grants a one-time Coin bonus + notification the first time a user's
 * platform-wide streak (from {@link UserStatsProjectionService.getStats})
 * crosses one of {@link STREAK_MILESTONES}.
 *
 * {@link checkAndGrant} is designed to be called on every streak-affecting
 * event (today: the `user_stats_projections` CDC recompute), not just once —
 * so its idempotency guard is load-bearing rather than defensive: without the
 * pre-check-before-grant, a user sitting ABOVE an already-granted milestone
 * (e.g. on day 45, past the day-30 bonus) would be re-notified — and, absent
 * `writeXpHistory`'s own (source, refId) guard, re-credited — on every single
 * recompute while their streak stays there. The XP-history row keyed by
 * `streak:<userId>:<days>` is the single source of truth for "already granted",
 * so the check-then-grant here is really a fast-path avoiding the wasted
 * transaction, with `writeXpHistory` as the hard backstop against races.
 */
@Injectable()
export class StreakMilestoneService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userStatsProjectionService: UserStatsProjectionService,
        private readonly notificationService: NotificationService,
    ) {}

    /**
     * Check one user's current streak against {@link STREAK_MILESTONES} and
     * grant + notify for every milestone reached that has not been granted yet.
     *
     * @param userId - the user whose streak just changed.
     */
    async checkAndGrant(userId: string): Promise<void> {
        // the platform-wide streak length (not the flashcard-specific one)
        const { streak } = await this.userStatsProjectionService.getStats(userId)
        for (const milestone of STREAK_MILESTONES) {
            // only milestones already reached by the current streak are candidates
            if (milestone.days > streak) {
                continue
            }
            // stable per-(user, milestone) key — doubles as the XP-history refId
            // and the "already granted" lookup key
            const refId = `streak:${userId}:${milestone.days}`
            // fast-path: skip the transaction entirely when already granted, so a
            // streak sitting above a past milestone does not re-notify on every
            // recompute (see class doc)
            const existing = await this.entityManager.findOne(
                XpHistoryEntity,
                {
                    where: {
                        source: XpSource.StreakMilestone,
                        refId,
                    },
                    select: {
                        id: true,
                    },
                },
            )
            if (existing) {
                continue
            }
            // grant + notify atomically: either both commit or neither does, so a
            // notification never fires for a bonus that failed to persist (and
            // vice versa)
            await this.entityManager.transaction(async (manager) => {
                await writeXpHistory({
                    entityManager: manager,
                    userId,
                    courseId: null,
                    source: XpSource.StreakMilestone,
                    amount: 0,
                    points: milestone.coin,
                    refId,
                })
                await this.notificationService.createNotification({
                    entityManager: manager,
                    userId,
                    type: NotificationType.StreakMilestone,
                    title: {
                        key: "notification.streakMilestone.title",
                        params: {
                            days: String(milestone.days),
                            coin: String(milestone.coin),
                        },
                    },
                })
            })
        }
    }
}
