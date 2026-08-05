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
    UserMockInterviewCourseStatsProjectionService,
} from "./user-mock-interview-course-stats-projection.service"
import type {
    MockInterviewAttemptCdcRow,
} from "./types"

@Injectable()
/**
 * CDC consumer that keeps `user_mock_interview_course_stats_projections`
 * fresh -- each new graded `mock_interview_attempts` row moves the
 * enrollment's course stats. The row carries `enrollment_id` directly, no
 * join needed. Connection + per-message safety are owned by
 * {@link AbstractProjectionListener}.
 */
export class UserMockInterviewCourseStatsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group -> restarts resume from the committed offset. */
    protected readonly groupId = "user-mock-interview-course-stats-projection"

    /** A new graded attempt row moves the enrollment's mock-interview course stats. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}mock_interview_attempts`,
    ]

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        private readonly userMockInterviewCourseStatsProjectionService: UserMockInterviewCourseStatsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
    }

    /**
     * A `mock_interview_attempts` row carries `enrollment_id` directly.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected enrollment id (0-1).
     */
    protected deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        const attemptRow = row as MockInterviewAttemptCdcRow
        return attemptRow.enrollment_id ? [
            attemptRow.enrollment_id,
        ] : []
    }

    /**
     * Recompute the affected enrollment's mock-interview course stats (idempotent UPSERT).
     *
     * @param enrollmentId - the affected enrollment id.
     */
    protected async recomputeTarget(enrollmentId: string): Promise<void> {
        await this.userMockInterviewCourseStatsProjectionService.recompute({
            enrollmentId,
        })
    }
}
