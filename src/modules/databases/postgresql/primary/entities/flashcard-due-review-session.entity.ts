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

@Entity("flashcard_due_review_sessions")
// fast per-enrollment session lookup (mirrors flashcard_quiz_sessions' /
// flashcard_review_sessions' own index) -- not the primary lookup path
// (that's by `id`), but useful for cleanup/debug queries scoped to one
// enrollment
@Index("idx_flashcard_due_review_sessions_enrollment",
    [
        "enrollmentId",
    ])
/**
 * One resumable draw of the CROSS-DECK due-review batch (due-review surfaced
 * from `DueReview`) -- mirrors
 * {@link import("./flashcard-review-session.entity").FlashcardReviewSessionEntity}'s
 * resumable-session shape, but scoped to an ENROLLMENT only (no `deckId` FK):
 * a due-review batch draws cards across MULTIPLE decks in one course (unlike
 * `FlashcardReviewSessionEntity`, which is pinned to a single deck), so it
 * cannot reuse that table. Grading itself still happens per-card through the
 * existing `reviewFlashcard` mutation, which already persists safely on every
 * rating -- this table only wraps that sequence with a resumable
 * batch/position bookkeeping so a learner who navigates away mid-batch does
 * not lose which cards were already drawn or how far they got.
 * `startFlashcardDueReviewSession` persists the drawn card order,
 * `syncFlashcardDueReviewSessionProgress` periodically snapshots the
 * in-flight position + reviewed count so a learner who navigates away can
 * pick it back up via `myInProgressFlashcardDueReviewSession`, and
 * `completeFlashcardDueReviewSession` flips the row to "completed".
 */
export class FlashcardDueReviewSessionEntity extends UuidAbstractEntity {
    /**
     * Enrollment this due-review batch belongs to (user x course) -- the
     * anchor every ownership-scoped lookup
     * (`syncFlashcardDueReviewSessionProgress`,
     * `myInProgressFlashcardDueReviewSession`,
     * `completeFlashcardDueReviewSession`) uses to make sure a session row is
     * only ever read/mutated on behalf of the SAME caller who started it.
     * Deliberately NO `deckId` FK (unlike
     * {@link import("./flashcard-review-session.entity").FlashcardReviewSessionEntity}) --
     * a due-review batch draws cards across multiple decks in the course, so
     * it cannot be pinned to one deck.
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
        foreignKeyConstraintName: "fk_enrollment_id_flashcard_due_review_sessions",
    })
        enrollment: EnrollmentEntity

    /** Owning enrollment id. */
    @Column({
        name: "enrollment_id",
        type: "uuid",
    })
    @RelationId(
        (session: FlashcardDueReviewSessionEntity) => session.enrollment,
    )
        enrollmentId: string

    /**
     * The `flashcard_cards.id` set drawn for this batch, in the order they
     * are asked -- snapshotted ONCE at `startFlashcardDueReviewSession` time
     * (never re-drawn on resume), so a resumed batch always sees the SAME
     * cards it started with regardless of any later deck/due-set changes.
     */
    @Column({
        name: "card_ids",
        type: "jsonb",
    })
        cardIds: Array<string>

    /**
     * 0-indexed card positions graded this session (order-independent) --
     * drives the FE per-segment green; distinct from `reviewedCount` which is
     * a plain count. Snapshotted by `syncFlashcardDueReviewSessionProgress` and
     * rehydrated on resume, so a learner who grades cards out of order (or
     * navigates away mid-batch) keeps the exact set of segments already
     * coloured, not just how many. Defaults to `[]` (a fresh session has
     * graded nothing yet).
     */
    @Column({
        name: "graded_indexes",
        type: "jsonb",
        default: () => "'[]'",
    })
        gradedIndexes: Array<number>

    /**
     * 0-based index of the card the learner was on at the last sync -- the
     * resume position `myInProgressFlashcardDueReviewSession` reports back
     * so the FE can restore the batch to exactly where the learner left off.
     * Defaults to 0 (a session always starts at its first card).
     */
    @Column({
        name: "current_index",
        type: "int",
        default: 0,
    })
        currentIndex: number

    /**
     * Cards actually graded this batch (via `reviewFlashcard`) -- increments
     * in lockstep with grading, snapshotted by
     * `syncFlashcardDueReviewSessionProgress` so history/stats don't need to
     * re-derive it from `current_index`. Mirrors
     * {@link import("./flashcard-review-session.entity").FlashcardReviewSessionEntity.reviewedCount}.
     */
    @Column({
        name: "reviewed_count",
        type: "int",
        default: 0,
    })
        reviewedCount: number

    /**
     * The XP local-estimate snapshot for this run -- placeholder bookkeeping
     * only, same reasoning as
     * {@link import("./flashcard-review-session.entity").FlashcardReviewSessionEntity.xpEarned}:
     * `reviewFlashcard` itself grants no XP today, so this column is not a
     * second XP grant, just a display value the client currently reports as
     * 0. Kept for shape-parity with the review/quiz session tables so a
     * future XP-for-due-review pass does not need a schema change.
     */
    @Column({
        name: "xp_earned",
        type: "int",
        default: 0,
    })
        xpEarned: number

    /**
     * The session's lifecycle state -- same 3 values and same reasoning as
     * {@link import("./flashcard-quiz-session.entity").FlashcardQuizSessionEntity.status}
     * (plain varchar, avoids the TypeORM `synchronize` `ADD VALUE` footgun on
     * a pg enum type). `startFlashcardDueReviewSession` flips any PRIOR
     * "in_progress" row for the same enrollment to "abandoned" before
     * persisting a new draw, so a learner never has two resumable due-review
     * batches at once.
     */
    @Column({
        name: "status",
        type: "varchar",
        default: "in_progress",
    })
        status: "in_progress" | "completed" | "abandoned"
}
