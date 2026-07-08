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
    UserXpProjectionService,
} from "./user-xp-projection.service"
import type {
    UserXpHistoryCdcRow,
    UserXpUserCdcRow,
} from "./types"

/**
 * CDC consumer that keeps `user_xp_projections` fresh — a new ledger row moves the
 * earner's per-source XP totals, and a `users` balance change moves their snapshot
 * of `total_points` / `coin_balance`. Both topics resolve to a single user id.
 * Connection + per-message safety are owned by {@link AbstractProjectionListener}.
 */
@Injectable()
export class UserXpProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "user-xp-projection"

    /** XP-ledger rows + user balance changes move a user's XP aggregate. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}xp_histories`,
        `${envConfig().kafka.cdcTopicPrefix}users`,
    ]

    constructor(
        kafkaService: KafkaService,
        private readonly userXpProjectionService: UserXpProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * An xp_histories row carries the earner's `user_id`; a users row carries `id`.
     * Returns the affected user id (0–1), or empty to skip.
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
        // a users row change carries the user id directly
        if (topic.endsWith("users")) {
            const userRow = row as UserXpUserCdcRow
            return userRow.id ? [
                userRow.id,
            ] : []
        }
        // an xp_histories row carries the earner's user id
        const xpRow = row as UserXpHistoryCdcRow
        return xpRow.user_id ? [
            xpRow.user_id,
        ] : []
    }

    /**
     * Recompute the affected user's XP aggregate (idempotent UPSERT).
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.userXpProjectionService.recompute({
            userId,
        })
    }
}
