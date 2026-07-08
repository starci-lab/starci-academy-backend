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
    UserFlashcardCourseStatsProjectionService,
} from "./user-flashcard-course-stats-projection.service"
import type {
    FlashcardCourseStatsSourceCdcRow,
} from "./types"

/**
 * CDC consumer that keeps `user_flashcard_course_stats_projections` fresh —
 * BOTH `flashcard_quiz_sessions` and `flashcard_review_sessions` converge on
 * this SAME enrollment-keyed projection (the two recap surfaces share one
 * grain), so a single listener on both topics is simpler than two. Each row
 * carries `enrollment_id` directly — no join needed to derive the recompute
 * target. {@link AbstractProjectionListener} already supports a multi-topic
 * `topics` array with a topic-agnostic `deriveTargets`, so no hand-rolled
 * `OnModuleInit` is needed here.
 */
@Injectable()
export class UserFlashcardCourseStatsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "user-flashcard-course-stats-projection"

    /** A new quiz OR review session row moves the enrollment's flashcard-course stats. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}flashcard_quiz_sessions`,
        `${envConfig().kafka.cdcTopicPrefix}flashcard_review_sessions`,
    ]

    constructor(
        kafkaService: KafkaService,
        private readonly userFlashcardCourseStatsProjectionService: UserFlashcardCourseStatsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * Both source rows carry `enrollment_id` directly — no join needed
     * regardless of which of the two topics the message came from.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected enrollment id (0–1).
     */
    protected deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        const sourceRow = row as FlashcardCourseStatsSourceCdcRow
        return sourceRow.enrollment_id ? [
            sourceRow.enrollment_id,
        ] : []
    }

    /**
     * Recompute the affected enrollment's flashcard-course stats (idempotent UPSERT).
     *
     * @param enrollmentId - the affected enrollment id.
     */
    protected async recomputeTarget(enrollmentId: string): Promise<void> {
        await this.userFlashcardCourseStatsProjectionService.recompute({
            enrollmentId,
        })
    }
}
