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
    UserFlashcardStatsProjectionService,
} from "./user-flashcard-stats-projection.service"
import type {
    FlashcardReviewEventCdcRow,
} from "./types"

@Injectable()
/**
 * CDC consumer that keeps `user_flashcard_stats_projections` fresh -- each new
 * `flashcard_review_events` row moves the reviewer's streak / retention / totals.
 * The event carries the reviewer's `user_id`, resolving to a single recompute
 * target. Connection + per-message safety are owned by
 * {@link AbstractProjectionListener}.
 */
export class UserFlashcardStatsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group -> restarts resume from the committed offset. */
    protected readonly groupId = "user-flashcard-stats-projection"

    /** A new review-event row moves the reviewer's flashcard stats. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}flashcard_review_events`,
    ]

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        private readonly userFlashcardStatsProjectionService: UserFlashcardStatsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
    }

    /**
     * A flashcard_review_events row carries the reviewer's `user_id`.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user id (0-1).
     */
    protected deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        const eventRow = row as FlashcardReviewEventCdcRow
        return eventRow.user_id ? [
            eventRow.user_id,
        ] : []
    }

    /**
     * Recompute the affected user's flashcard stats (idempotent UPSERT).
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.userFlashcardStatsProjectionService.recompute({
            userId,
        })
    }
}
