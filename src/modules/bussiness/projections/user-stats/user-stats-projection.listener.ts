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
    AbstractProjectionListener,
    type ProjectionCdcMessage,
} from "@modules/projection"
import {
    UserStatsProjectionService,
} from "./user-stats-projection.service"

/** CDC row from `user_follows` (both endpoints' stats move on a follow change). */
interface UserFollowCdcRow {
    /** The follower endpoint (its following_count moves). */
    follower_id?: string
    /** The followed endpoint (its follower_count moves). */
    following_id?: string
}

/** CDC row from `notifications` (the recipient's unread count moves). */
interface NotificationCdcRow {
    /** Recipient user id. */
    user_id?: string
}

/**
 * CDC consumer that keeps `user_stats_projections` fresh. A follow change moves
 * BOTH endpoints' counters; a notification change moves the recipient's unread
 * count. Connection + per-message safety are owned by {@link AbstractProjectionListener}.
 */
@Injectable()
export class UserStatsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "user-stats-projection"

    /** Follow-graph + notification changes move a user's stats. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}user_follows`,
        `${envConfig().kafka.cdcTopicPrefix}notifications`,
    ]

    constructor(
        kafkaService: KafkaService,
        private readonly userStatsProjectionService: UserStatsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * A follow row touches both endpoints; a notification row touches its
     * recipient. Returns the affected user id(s), de-duplicated.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user ids (0–2), or empty to skip.
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
     * Recompute one user's stats projection (idempotent UPSERT).
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.userStatsProjectionService.recompute({
            userId,
        })
    }
}
