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
    AchievementsService,
} from "./achievements.service"
import type {
    AchievementCdcRow,
} from "./types"

/**
 * CDC consumer that awards achievements as a user's source metrics change. An
 * `xp_histories` row moves lessons read / challenges passed / milestones passed /
 * streak (every XP-earning event writes one); an `enrollments` row moves the
 * enrolled-courses count. Either resolves to the affected user, who is then
 * re-evaluated against every definition (idempotent award INSERTs).
 *
 * Connection + per-message safety (one bad message is logged + swallowed) are
 * owned by {@link AbstractProjectionListener}; recompute is idempotent so the
 * next message self-heals.
 */
@Injectable()
export class AchievementsListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "achievements-award"

    /** XP-earning events + enrollments move a user's achievement-eligible metrics. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}xp_histories`,
        `${envConfig().kafka.cdcTopicPrefix}enrollments`,
    ]

    constructor(
        kafkaService: KafkaService,
        private readonly achievementsService: AchievementsService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * Both an XP-history row and an enrollment row carry the affected `user_id`.
     * Returns it (0–1 ids), skipping rows with no user id.
     *
     * @param message - {@link ProjectionCdcMessage} (source topic + flat row).
     * @returns the affected user id, or empty to skip.
     */
    protected deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        // both source tables expose the earner/enrollee via user_id
        const cdcRow = row as AchievementCdcRow
        if (!cdcRow.user_id) {
            return []
        }
        return [
            cdcRow.user_id,
        ]
    }

    /**
     * Re-evaluate + award achievements for one user (idempotent INSERTs).
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.achievementsService.recomputeForUser({
            userId,
        })
    }
}
