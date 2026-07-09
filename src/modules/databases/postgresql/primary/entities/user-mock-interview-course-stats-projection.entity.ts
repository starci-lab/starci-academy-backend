import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"
import {
    EnrollmentEntity,
} from "./enrollment.entity"

/**
 * CQRS projection of a user's mock-interview COURSE stats — one row per
 * enrollment (Kiểu A — single key `enrollment_id`, mirrors
 * {@link import("./user-challenge-progress-projection.entity").UserChallengeProgressProjectionEntity}).
 *
 * The inherited jsonb `value` holds the full `MyMockInterviewStatsResultData`
 * shape (`insufficientData`, `modeSplit`, `trend`, `byPhase`, `byKind`,
 * `weakest`) — the SAME aggregate `MyMockInterviewStatsService.compute` used
 * to fold live on every read from a bounded ≤50-row scan, a rule violation
 * per `.claude/be/rules/cqrs-no-inline-aggregate.md` ("kể cả scale nhỏ").
 */
@Entity("user_mock_interview_course_stats_projections")
export class UserMockInterviewCourseStatsProjectionEntity extends AbstractProjectionEntity {
    /** Enrollment this course-stats row belongs to — the natural primary key. */
    @PrimaryColumn({
        name: "enrollment_id",
        type: "uuid",
    })
        enrollmentId: string

    /** The enrollment the stats are scoped to (cascade-deleted with it). */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_enrollment_id_user_mock_interview_course_stats_projections",
    })
        enrollment: EnrollmentEntity
}
