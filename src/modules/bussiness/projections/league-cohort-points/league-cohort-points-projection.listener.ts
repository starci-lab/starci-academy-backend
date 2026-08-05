import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
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
    LeagueCohortPointsProjectionService,
} from "./league-cohort-points-projection.service"
import type {
    CohortIdRow,
    LeagueCohortPointsXpHistoryCdcRow,
} from "./types"

@Injectable()
/**
 * CDC consumer that keeps `league_cohort_points_projections` fresh -- a points
 * event rebuilds the earner's current cohort board. The xp_histories row carries
 * only `user_id`, so the affected cohort is resolved via `user_leagues`. A user
 * with no current cohort (unplaced) is skipped. TTL lazy-refresh is the fallback.
 */
export class LeagueCohortPointsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group -> restarts resume from the committed offset. */
    protected readonly groupId = "league-cohort-points-projection"

    /** Points events move the earner's cohort board. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}xp_histories`,
    ]

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly leagueCohortPointsProjectionService: LeagueCohortPointsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
    }

    /**
     * Resolve the earner's current cohort id from the points event's `user_id`
     * (via user_leagues). Returns 0-1 cohort ids (skips unplaced users).
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected cohort id(s).
     */
    protected async deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Promise<Array<string>> {
        const xpRow = row as LeagueCohortPointsXpHistoryCdcRow
        if (!xpRow.user_id) {
            return []
        }
        // xp_histories has no cohort_id -> look up the earner's current cohort
        const found = await this.entityManager.query<Array<CohortIdRow>>(
            `
            SELECT ul.cohort_id
            FROM user_leagues ul
            WHERE ul.user_id = $1
            LIMIT 1
            `,
            [
                xpRow.user_id,
            ],
        )
        const cohortId = found[0]?.cohort_id
        return cohortId ? [
            cohortId,
        ] : []
    }

    /**
     * Recompute the affected cohort's ranked board.
     *
     * @param cohortId - the affected cohort id.
     */
    protected async recomputeTarget(cohortId: string): Promise<void> {
        await this.leagueCohortPointsProjectionService.recompute({
            cohortId,
        })
    }
}
