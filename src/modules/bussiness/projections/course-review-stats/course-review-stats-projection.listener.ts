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
    CourseReviewStatsProjectionService,
} from "./course-review-stats-projection.service"
import type {
    CourseReviewStatsCdcRow,
} from "./types"

@Injectable()
/**
 * CDC consumer that keeps `course_review_stats_projections` fresh.
 *
 * Any change to a review -- written, edited or removed -- moves the course's aggregate, so all
 * three arrive on the same topic and all three recompute the same way. Connection, subscription
 * and per-message failure isolation are owned by {@link AbstractProjectionListener}.
 */
export class CourseReviewStatsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group -> restarts resume from the committed offset instead of replaying history. */
    protected readonly groupId = "course-review-stats-projection"

    /** Review changes move a course's rating. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}course_reviews`,
    ]

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        private readonly courseReviewStatsProjectionService: CourseReviewStatsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
    }

    /**
     * A review row carries `course_id` directly, so the recompute key is that id.
     *
     * This is why the entity keeps `course_id` as its own column beside the relation: a Debezium
     * payload is columns, and a relation this listener cannot join is a target it cannot derive.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected course id, or empty to skip.
     */
    protected deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        const courseId = (row as CourseReviewStatsCdcRow).course_id
        // no course id (tombstone / unexpected shape) -> nothing to recompute. A delete arrives
        // with no `after` image, and inventing a target from one would be CDC-5's exact refusal
        if (!courseId) {
            return []
        }
        return [
            courseId,
        ]
    }

    /**
     * Recompute one course's review aggregate (idempotent UPSERT).
     *
     * @param courseId - the affected course id.
     */
    protected async recomputeTarget(courseId: string): Promise<void> {
        await this.courseReviewStatsProjectionService.recompute({
            courseId,
        })
    }
}
