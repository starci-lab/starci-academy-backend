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
    CourseStatsProjectionService,
} from "./course-stats-projection.service"
import type {
    CourseStatsEnrollmentCdcRow,
} from "./types"

@Injectable()
/**
 * CDC consumer that keeps `course_stats_projections` fresh. Any enrollment
 * change recomputes the affected course's counters. Connection + per-message
 * safety are owned by {@link AbstractProjectionListener}.
 */
export class CourseStatsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group -> restarts resume from the committed offset. */
    protected readonly groupId = "course-stats-projection"

    /** Enrollment changes move a course's enrollment count. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}enrollments`,
    ]

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        private readonly courseStatsProjectionService: CourseStatsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
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
        const courseId = (row as CourseStatsEnrollmentCdcRow).course_id
        // no course id (tombstone / unexpected shape) -> nothing to recompute
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
