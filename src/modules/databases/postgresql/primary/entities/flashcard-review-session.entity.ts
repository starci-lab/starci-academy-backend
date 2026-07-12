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
import {
    FlashcardDeckEntity,
} from "./flashcard-deck.entity"

/**
 * One resumable draw of the SM-2 flashcard reviewer ("Học thẻ") over ONE deck —
 * mirrors {@link import("./flashcard-quiz-session.entity").FlashcardQuizSessionEntity}'s
 * resumable-session shape, but scoped to a single deck (not the whole course) and
 * without any cloze-quiz concept (no mode/level/coverage/weakTags — grading itself
 * still runs through the existing `reviewFlashcard` mutation per card; this table is
 * purely a resumable progress/stats wrapper around a sequence of those calls):
 * `startFlashcardReviewSession` persists the deck's card order, `syncFlashcardReviewSessionProgress`
 * periodically snapshots the in-flight position + reviewed count so a learner who
 * navigates away mid-review can pick it back up via `myInProgressFlashcardReviewSession`,
 * and `completeFlashcardReviewSession` flips the row to "completed".
 */
@Entity("flashcard_review_sessions")
// fast per-enrollment session lookup (mirrors flashcard_quiz_sessions' own index)
@Index("idx_flashcard_review_sessions_enrollment",
    [
        "enrollmentId",
    ])
// fast per-deck resume lookup — `myInProgressFlashcardReviewSession` is scoped by
// (enrollment, deck), unlike quiz sessions which are scoped by enrollment alone
@Index("idx_flashcard_review_sessions_deck",
    [
        "deckId",
    ])
export class FlashcardReviewSessionEntity extends UuidAbstractEntity {
    /**
     * Enrollment this review draw belongs to (user × course) — the anchor every
     * ownership-scoped lookup (`syncFlashcardReviewSessionProgress`,
     * `myInProgressFlashcardReviewSession`, `completeFlashcardReviewSession`) uses
     * to make sure a session row is only ever read/mutated on behalf of the SAME
     * caller who started it.
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
        foreignKeyConstraintName: "fk_enrollment_id_flashcard_review_sessions",
    })
        enrollment: EnrollmentEntity

    /** Owning enrollment id. */
    @Column({
        name: "enrollment_id",
        type: "uuid",
    })
    @RelationId(
        (session: FlashcardReviewSessionEntity) => session.enrollment,
    )
        enrollmentId: string

    /** The deck being reviewed — review sessions are scoped to ONE deck (unlike
     *  quiz sessions, which draw across the whole course). */
    @ManyToOne(
        () => FlashcardDeckEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "deck_id",
        foreignKeyConstraintName: "fk_deck_id_flashcard_review_sessions",
    })
        deck: FlashcardDeckEntity

    /** Owning deck id. */
    @Column({
        name: "deck_id",
        type: "uuid",
    })
    @RelationId(
        (session: FlashcardReviewSessionEntity) => session.deck,
    )
        deckId: string

    /**
     * The `flashcard_cards.id` set for this deck, in display order (by
     * `sortIndex`) — snapshotted ONCE at `startFlashcardReviewSession` time
     * (never re-drawn on resume), so a resumed session always sees the SAME
     * card order it started with regardless of any later deck changes.
     */
    @Column({
        name: "card_ids",
        type: "jsonb",
    })
        cardIds: Array<string>

    /**
     * 0-indexed card positions graded this session (order-independent) —
     * drives the FE per-segment green; distinct from `reviewedCount` which is
     * a plain count. Snapshotted by `syncFlashcardReviewSessionProgress` and
     * rehydrated on resume, so a learner who grades cards out of order (or
     * navigates away mid-review) keeps the exact set of segments already
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
     * 0-based index of the card the learner was on at the last sync — the
     * resume position `myInProgressFlashcardReviewSession` reports back so the
     * FE can restore the reviewer to exactly where the learner left off.
     * Defaults to 0 (a session always starts at its first card).
     */
    @Column({
        name: "current_index",
        type: "int",
        default: 0,
    })
        currentIndex: number

    /**
     * Cards actually graded this session (via `reviewFlashcard`) — increments
     * in lockstep with grading, snapshotted by
     * `syncFlashcardReviewSessionProgress` so history/stats don't need to
     * re-derive it from `current_index` (which can also move on "previous").
     */
    @Column({
        name: "reviewed_count",
        type: "int",
        default: 0,
    })
        reviewedCount: number

    /**
     * The XP local-estimate snapshot for this run, same bookkeeping role as
     * {@link import("./flashcard-quiz-session.entity").FlashcardQuizSessionEntity.xpEarned} —
     * `reviewFlashcard` itself grants no XP today, so this is purely a display
     * value for the recap/history, not a second XP grant.
     */
    @Column({
        name: "xp_earned",
        type: "int",
        default: 0,
    })
        xpEarned: number

    /**
     * The session's lifecycle state — same 3 values and same reasoning as
     * {@link import("./flashcard-quiz-session.entity").FlashcardQuizSessionEntity.status}
     * (plain varchar, avoids the TypeORM `synchronize` `ADD VALUE` footgun on a
     * pg enum type). `startFlashcardReviewSession` flips any PRIOR
     * "in_progress" row for the same enrollment+deck to "abandoned" before
     * persisting a new draw.
     */
    @Column({
        name: "status",
        type: "varchar",
        default: "in_progress",
    })
        status: "in_progress" | "completed" | "abandoned"
}
