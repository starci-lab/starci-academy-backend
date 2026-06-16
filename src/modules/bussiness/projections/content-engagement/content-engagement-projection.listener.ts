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
    ContentEngagementProjectionService,
} from "./content-engagement-projection.service"
import type {
    ContentScopedCdcRow,
} from "./types"

/**
 * CDC consumer that keeps `content_engagement_projections` fresh. Tails the
 * three tables that move a content's engagement — reactions, comments, and
 * read-state (view count) — and recomputes the affected content's projection.
 * Connection + per-message safety are owned by {@link AbstractProjectionListener}.
 */
@Injectable()
export class ContentEngagementProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "content-engagement-projection"

    /** Reactions / comments / read-state changes all move content engagement. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}content_reactions`,
        `${envConfig().kafka.cdcTopicPrefix}content_comments`,
        `${envConfig().kafka.cdcTopicPrefix}user_contents`,
    ]

    constructor(
        kafkaService: KafkaService,
        private readonly contentEngagementProjectionService: ContentEngagementProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * Every one of the three source tables carries `content_id` directly, so the
     * recompute key is simply that id (or nothing when the column is absent).
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected content id, or empty to skip.
     */
    protected deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        // narrow the row to the content-scoped shape
        const contentId = (row as ContentScopedCdcRow).content_id
        // no content id (tombstone / unexpected shape) → nothing to recompute
        if (!contentId) {
            return []
        }
        return [
            contentId,
        ]
    }

    /**
     * Recompute one content's engagement projection (idempotent UPSERT).
     *
     * @param contentId - the affected content id.
     */
    protected async recomputeTarget(contentId: string): Promise<void> {
        await this.contentEngagementProjectionService.recompute({
            contentId,
        })
    }
}
