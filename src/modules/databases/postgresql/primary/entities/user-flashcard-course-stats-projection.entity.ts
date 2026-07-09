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
 * CQRS projection of a user's flashcard quick-quiz + review stats for ONE
 * course — ONE ROW PER enrollment. `enrollment_id` alone already uniquely
 * determines the (user, course) grain (`flashcard_quiz_sessions` /
 * `flashcard_review_sessions` are both keyed by `enrollment_id` directly), so
 * this is a single-column primary key rather than a composite
 * `(user_id, course_id)` — simpler than `UserCourseProgressProjectionEntity`'s
 * Kiểu-B shape.
 *
 * The inherited jsonb `value` holds `{ quizTrend, quizByTag, quizByDeck,
 * reviewByDeck }` — see `UserFlashcardCourseStatsResult`. The heavy scan/fold
 * over `flashcard_quiz_sessions` / `flashcard_review_sessions` /
 * `flashcard_cards` runs ONLY in the projection's `recompute`, never inline at
 * read time (mirrors `MyFlashcardQuizStatsService` / `MyFlashcardReviewStatsService`,
 * which used to compute this live on every read). Read with a TTL
 * lazy-refresh; kept fresh by CDC on both source tables.
 */
@Entity("user_flashcard_course_stats_projections")
export class UserFlashcardCourseStatsProjectionEntity extends AbstractProjectionEntity {
    /** Owning enrollment id — the natural (primary) key. */
    @PrimaryColumn({
        name: "enrollment_id",
        type: "uuid",
    })
        enrollmentId: string

    /** The enrollment this projection belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_enrollment_id_user_flashcard_course_stats_projections",
    })
        enrollment: EnrollmentEntity
}
