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
    AchievementsService,
} from "./achievements.service"
import type {
    AchievementSourceRow,
} from "./types"

/** Source tables whose changes can move a badge metric → invalidate the wall. */
const SOURCE_TABLES = [
    "user_contents",
    "xp_histories",
    "user_challenge_submission_attempts",
    "user_milestone_task_attempts",
    "enrollments",
    "content_comments",
    "user_follows",
    "coding_submissions",
    "ai_lab_eval_runs",
    "user_leagues",
]

@Injectable()
/**
 * CDC consumer that keeps `user_achievement_projections` honest. Rather than
 * recompute eagerly (the award pass is heavier than a per-row projection), it
 * INVALIDATES the affected user's cached wall — a hard delete — so the next read
 * recomputes + re-awards from source. The projection's TTL is the lazy fallback
 * for any missed event. Kafka plumbing + per-message safety are owned by
 * {@link AbstractProjectionListener}.
 */
export class AchievementProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "achievement-projection"

    /** Every badge-metric source table, prefixed to its CDC topic. */
    protected readonly topics = SOURCE_TABLES.map(
        (table) => `${envConfig().kafka.cdcTopicPrefix}${table}`,
    )

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        private readonly achievementsService: AchievementsService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
    }

    /**
     * Map a source row to the user whose wall it touches. A follow change moves
     * the FOLLOWED user's badge; everything else moves the acting user.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user id (0–1).
     */
    protected deriveTargets(
        {
            topic,
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        const sourceRow = row as AchievementSourceRow
        // a follow row's badge belongs to the followed user, not the follower
        const userId = topic.endsWith("user_follows")
            ? sourceRow.following_id
            : sourceRow.user_id
        return userId ? [userId] : []
    }

    /**
     * Delete-on-write: drop the user's cached wall so the next read recomputes +
     * re-awards. (The base method is named `recomputeTarget`; here it invalidates.)
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.achievementsService.invalidate(userId)
    }
}
