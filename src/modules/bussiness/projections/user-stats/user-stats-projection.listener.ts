import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    KafkaService,
} from "@modules/kafka"
import {
    WinstonService,
} from "@modules/winston"
import {
    AbstractProjectionListener,
    type ProjectionCdcMessage,
} from "@modules/projection"
import {
    UserStatsProjectionService,
} from "./user-stats-projection.service"
import {
    StreakMilestoneService,
} from "../../streak/streak-milestone.service"
import type {
    NotificationCdcRow,
    UserFollowCdcRow,
    UserStatsXpHistoryCdcRow,
} from "./types"

@Injectable()
/**
 * CDC consumer that keeps `user_stats_projections` fresh. A follow change moves
 * BOTH endpoints' counters; a notification change moves the recipient's unread
 * count; an XP-history row moves the earner's streak + rolling weekly metrics.
 * Connection + per-message safety are owned by {@link AbstractProjectionListener}.
 */
export class UserStatsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group -> restarts resume from the committed offset. */
    protected readonly groupId = "user-stats-projection"

    /** Follow-graph + notification + XP-earning changes move a user's stats. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}user_follows`,
        `${envConfig().kafka.cdcTopicPrefix}notifications`,
        `${envConfig().kafka.cdcTopicPrefix}xp_histories`,
    ]

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        private readonly userStatsProjectionService: UserStatsProjectionService,
        private readonly streakMilestoneService: StreakMilestoneService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
    }

    /**
     * A follow row touches both endpoints; a notification row touches its
     * recipient. Returns the affected user id(s), de-duplicated.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user ids (0-2), or empty to skip.
     */
    protected deriveTargets(
        {
            topic,
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        // a follow change moves the follower's following_count + the followed's follower_count
        if (topic.endsWith("user_follows")) {
            const followRow = row as UserFollowCdcRow
            // collect both endpoints, dropping any missing id, de-duplicated
            return [
                followRow.follower_id,
                followRow.following_id,
            ].filter((userId): userId is string => Boolean(userId))
        }
        // an XP-history change moves only the earner's streak + weekly metrics
        if (topic.endsWith("xp_histories")) {
            const xpRow = row as UserStatsXpHistoryCdcRow
            if (!xpRow.user_id) {
                return []
            }
            return [
                xpRow.user_id,
            ]
        }
        // a notification change moves only the recipient's unread count
        const notificationRow = row as NotificationCdcRow
        if (!notificationRow.user_id) {
            return []
        }
        return [
            notificationRow.user_id,
        ]
    }

    /**
     * Recompute one user's stats projection (idempotent UPSERT), then check
     * whether the refreshed streak just crossed a platform-wide milestone
     * (7/30/100 consecutive days) and grant the one-time Coin bonus if so, plus
     * the smaller once-per-day "kept the streak alive today" bonus.
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.userStatsProjectionService.recompute({
            userId,
        })
        await this.streakMilestoneService.checkAndGrant(userId)
        await this.streakMilestoneService.checkAndGrantDailyBonus(userId)
    }
}
