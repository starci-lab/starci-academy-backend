import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    EnrollmentEntity,
} from "./enrollment.entity"

/**
 * One card's outcome within an IN-FLIGHT flashcard quick-quiz ("Hỏi nhanh")
 * session, snapshotted onto {@link FlashcardQuizSessionEntity.results} by
 * `syncFlashcardQuizSessionProgress` so a resumed session can restore exactly
 * what was already answered — mirrors the shape `completeFlashcardQuizSession`
 * already accepts per-card (`QuizSessionAnswerRequest`), so the final
 * `completeFlashcardQuizSession` call re-sends this same per-card breakdown.
 * Stored as a plain jsonb array (not typed columns), same reasoning as every
 * other jsonb column on this entity — schema-evolution friendly.
 */
export interface FlashcardQuizSessionResult {
    /** The flashcard this answer belongs to. */
    cardId: string
    /** How many cloze blanks on this card the learner filled correctly. */
    correctBlanks: number
    /** Total cloze blanks on this card (the denominator for this card's coverage). */
    totalBlanks: number
}

/**
 * One resumable draw of the flashcard quick-quiz ("Hỏi nhanh") flow —
 * "resume flashcard quiz session" (2026-07-08), mirroring the SAME
 * resumable-session shape as
 * {@link import("./mock-interview-session.entity").MockInterviewSessionEntity}:
 * `startFlashcardQuizSession` persists the drawn card set,
 * `syncFlashcardQuizSessionProgress` periodically snapshots the in-flight
 * position + per-card results so a learner who navigates away mid-quiz can
 * pick it back up via `myInProgressFlashcardQuizSession`, and
 * `completeFlashcardQuizSession` flips the row to "completed" once the XP
 * grant succeeds.
 */
@Entity("flashcard_quiz_sessions")
// fast per-enrollment session lookup (mirrors mock_interview_sessions' own
// index) — not the primary lookup path (that's by `id`), but useful for
// cleanup/debug queries scoped to one enrollment
@Index("idx_flashcard_quiz_sessions_enrollment",
    [
        "enrollmentId",
    ])
export class FlashcardQuizSessionEntity extends UuidAbstractEntity {
    /**
     * Enrollment this quiz draw belongs to (user × course) — the anchor every
     * ownership-scoped lookup (`syncFlashcardQuizSessionProgress`,
     * `myInProgressFlashcardQuizSession`, `completeFlashcardQuizSession`) uses
     * to make sure a session row is only ever read/mutated on behalf of the
     * SAME caller who started it.
     */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName: "fk_enrollment_id_flashcard_quiz_sessions",
    })
        enrollment: EnrollmentEntity

    /** Owning enrollment id. */
    @Column({
        name: "enrollment_id",
        type: "uuid",
    })
    @RelationId(
        (session: FlashcardQuizSessionEntity) => session.enrollment,
    )
        enrollmentId: string

    /**
     * The `flashcard_cards.id` set drawn for this session, in the order they
     * are asked — snapshotted ONCE at `startFlashcardQuizSession` time (never
     * re-drawn on resume), so a resumed session always sees the SAME cards it
     * started with regardless of any later deck changes.
     */
    @Column({
        name: "card_ids",
        type: "jsonb",
    })
        cardIds: Array<string>

    /**
     * 0-based index of the card the learner was on at the last sync — the
     * resume position `myInProgressFlashcardQuizSession` reports back so the
     * FE can restore the workspace to exactly where the learner left off.
     * Defaults to 0 (a session always starts at its first card).
     */
    @Column({
        name: "current_index",
        type: "int",
        default: 0,
    })
        currentIndex: number

    /**
     * Snapshot of the in-flight per-card results, periodically overwritten by
     * `syncFlashcardQuizSessionProgress` (never by `startFlashcardQuizSession`,
     * which always leaves this an empty array on a fresh draw) — the source a
     * resumed session replays from, and the SAME per-card breakdown eventually
     * re-sent to `completeFlashcardQuizSession` for scoring. Defaults to an
     * empty array (not null) so a fresh draw's resume payload never has to
     * null-guard this field.
     */
    @Column({
        name: "results",
        type: "jsonb",
        nullable: true,
        default: () => "'[]'",
    })
        results: Array<FlashcardQuizSessionResult> | null

    /**
     * The session's lifecycle state — "resume flashcard quiz session"
     * (2026-07-08): a learner who navigates away mid-quiz can pick their draw
     * back up via `myInProgressFlashcardQuizSession` /
     * `syncFlashcardQuizSessionProgress` as long as it is still "in_progress".
     * `startFlashcardQuizSession` flips any PRIOR "in_progress" row for the
     * same enrollment to "abandoned" before persisting a new draw (so a
     * learner never has two resumable sessions at once), and
     * `completeFlashcardQuizSession` flips the row to "completed" once its XP
     * grant succeeds. Plain varchar (not a pg enum) — same reasoning as
     * {@link import("./mock-interview-session.entity").MockInterviewSessionEntity.status}
     * (avoids the TypeORM `synchronize` `ADD VALUE` footgun on a pg enum type),
     * and uses the SAME 3 string values for consistency across both
     * resumable-session tables. Defaults to "in_progress" so a row written
     * before this column existed still reads as a valid status.
     */
    @Column({
        name: "status",
        type: "varchar",
        default: "in_progress",
    })
        status: "in_progress" | "completed" | "abandoned"
}
