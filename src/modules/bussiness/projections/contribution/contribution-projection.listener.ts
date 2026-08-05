import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    KafkaService,
} from "@modules/integrations/kafka/kafka.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    AbstractProjectionListener,
} from "@modules/platform/projection/abstract-projection.listener"
import type {
    ProjectionCdcMessage,
} from "@modules/platform/projection/types"
import {
    ContributionProjectionService,
} from "./contribution-projection.service"
import type {
    ActivityCdcRow,
} from "./types"

@Injectable()
/**
 * CDC consumer that keeps `user_contribution_projections` fresh. A new activity
 * row moves the actor's current-year calendar; the projection's TTL lazy-refresh
 * is the fallback for the daily window drift. Connection + per-message safety are
 * owned by {@link AbstractProjectionListener}.
 */
export class ContributionProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group -> restarts resume from the committed offset. */
    protected readonly groupId = "contribution-projection"

    /** Activity-ledger changes move the actor's contribution calendar. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}activities`,
    ]

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        private readonly contributionProjectionService: ContributionProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
    }

    /**
     * An activity row touches only its actor. Returns the actor id, or empty to skip.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user id (0-1).
     */
    protected deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        // only the actor's calendar changes; drop rows with no user id
        const activityRow = row as ActivityCdcRow
        if (!activityRow.user_id) {
            return []
        }
        return [
            activityRow.user_id,
        ]
    }

    /**
     * Recompute the actor's CURRENT-year calendar (new activities land in the
     * present year; past years are immutable so they never need a CDC rebuild).
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.contributionProjectionService.recompute({
            userId,
            year: new Date().getFullYear(),
        })
    }
}
