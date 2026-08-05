import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CoinHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/coin-history.entity"
import {
    CoinSource,
} from "@modules/databases/postgresql/primary/enums/coin-source"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    writeCoinHistory,
} from "@features/api/processors/ai/shared/xp/write-coin-history"
import {
    NotificationService,
} from "../notification/notification.service"
import {
    UserStatsProjectionService,
} from "../projections/user-stats/user-stats-projection.service"

/**
 * Coin bonus for keeping the streak alive on ONE calendar day (Asia/Ho_Chi_Minh),
 * granted once per day on top of whatever per-activity coin the day's actions
 * already earned. Finalized deliberately LOW (below dailyQuest's 20) -- "streak
 * still alive" is an easier bar than "3/5 daily tasks done", so it's a thin
 * consistency layer, not a competing reward (see
 * `.artifacts/proposals/coin-xp-economy-numbers.proposal.md`).
 */
export const STREAK_DAILY_BONUS_COIN = 5

/** One platform-wide streak length that grants a one-time Coin bonus. */
export interface StreakMilestone {
    /** Consecutive-day streak length that unlocks the bonus. */
    readonly days: number
    /** Coin credited exactly once when the milestone is first reached. */
    readonly coin: number
}

/**
 * Platform-wide streak milestones (7/30/100 consecutive days), ordered
 * ascending. Each is granted exactly once per user -- see {@link
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

@Injectable()
/**
 * Grants a one-time Coin bonus + notification the first time a user's
 * platform-wide streak (from {@link UserStatsProjectionService.getStats})
 * crosses one of {@link STREAK_MILESTONES}.
 *
 * {@link checkAndGrant} is designed to be called on every streak-affecting
 * event (today: the `user_stats_projections` CDC recompute), not just once --
 * so its idempotency guard is load-bearing rather than defensive: without the
 * pre-check-before-grant, a user sitting ABOVE an already-granted milestone
 * (e.g. on day 45, past the day-30 bonus) would be re-notified -- and, absent
 * `writeCoinHistory`'s own (source, refId) guard, re-credited -- on every single
 * recompute while their streak stays there. The Coin-history row keyed by
 * `streak:<userId>:<days>` is the single source of truth for "already granted",
 * so the check-then-grant here is really a fast-path avoiding the wasted
 * transaction, with `writeCoinHistory` as the hard backstop against races.
 */
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
            // stable per-(user, milestone) key -- doubles as the Coin-history refId
            // and the "already granted" lookup key
            const refId = `streak:${userId}:${milestone.days}`
            // fast-path: skip the transaction entirely when already granted, so a
            // streak sitting above a past milestone does not re-notify on every
            // recompute (see class doc)
            const existing = await this.entityManager.findOne(
                CoinHistoryEntity,
                {
                    where: {
                        source: CoinSource.StreakMilestone,
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
                await writeCoinHistory({
                    entityManager: manager,
                    userId,
                    source: CoinSource.StreakMilestone,
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

    /**
     * Grant {@link STREAK_DAILY_BONUS_COIN} once for TODAY (Asia/Ho_Chi_Minh)
     * when the user was active today -- reuses `last7Days`' last entry (today's
     * slot) rather than a fresh query, since {@link checkAndGrant} already
     * forces a fresh {@link UserStatsProjectionService.getStats} read on every
     * streak-affecting event. A non-active today (e.g. a stats read with no new
     * activity) is a no-op -- idempotent via the `(source, refId)` Coin-history
     * key, same backstop pattern as {@link checkAndGrant}.
     *
     * @param userId - the user whose stats just changed.
     */
    async checkAndGrantDailyBonus(userId: string): Promise<void> {
        const { last7Days } = await this.userStatsProjectionService.getStats(userId)
        // last7Days is ordered oldest -> today; the last entry IS today (VN calendar)
        const today = last7Days[last7Days.length - 1]
        if (!today?.active) {
            return
        }
        const refId = `streakDaily:${userId}:${today.date}`
        const existing = await this.entityManager.findOne(
            CoinHistoryEntity,
            {
                where: {
                    source: CoinSource.StreakDailyBonus,
                    refId,
                },
                select: {
                    id: true,
                },
            },
        )
        if (existing) {
            return
        }
        await writeCoinHistory({
            entityManager: this.entityManager,
            userId,
            source: CoinSource.StreakDailyBonus,
            points: STREAK_DAILY_BONUS_COIN,
            refId,
        })
    }
}
