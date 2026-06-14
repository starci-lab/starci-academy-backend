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
    CourseStatsProjectionService,
} from "./course-stats-projection.service"

/** CDC row from `enrollments` (carries the course whose count moved). */
interface EnrollmentCdcRow {
    /** The course the enrollment belongs to. */
    course_id?: string
}

/**
 * CDC consumer that keeps `course_stats_projections` fresh. Any enrollment
 * change recomputes the affected course's counters. Connection + per-message
 * safety are owned by {@link AbstractProjectionListener}.
 */
@Injectable()
export class CourseStatsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "course-stats-projection"

    /** Enrollment changes move a course's enrollment count. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}enrollments`,
    ]

    constructor(
        kafkaService: KafkaService,
        private readonly courseStatsProjectionService: CourseStatsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * An enrollment row carries `course_id` directly, so the recompute key is
     * that id (or nothing when absent).
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected course id, or empty to skip.
     */
    protected deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        // narrow the row to the enrollment shape
        const courseId = (row as EnrollmentCdcRow).course_id
        // no course id (tombstone / unexpected shape) → nothing to recompute
        if (!courseId) {
            return []
        }
        return [
            courseId,
        ]
    }

    /**
     * Recompute one course's stats projection (idempotent UPSERT).
     *
     * @param courseId - the affected course id.
     */
    protected async recomputeTarget(courseId: string): Promise<void> {
        await this.courseStatsProjectionService.recompute({
            courseId,
        })
    }
}
