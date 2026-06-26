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
    UserEntity,
} from "./user.entity"
import {
    EnrollmentEntity,
} from "./enrollment.entity"
import {
    FlashcardDeckEntity,
} from "./flashcard-deck.entity"
import {
    FlashcardCardEntity,
} from "./flashcard-card.entity"

/**
 * Append-only log of every graded mock-interview answer. One row per
 * `gradeInterviewAnswer` call, capturing the score + verdict the model assigned
 * plus a snapshot of the question's seniority level and tags. This is what powers
 * cross-session interview history: average score over time, pass rate, and the
 * weakest topics (tags of the answers not passed). Verdict + level are stored as
 * plain strings so this persistence entity stays free of any bussiness-layer
 * enum import (the query layer maps them back).
 */
@Entity("interview_attempts")
// fast scan of a user's interview history, optionally scoped to one deck
@Index("idx_interview_attempts_user_deck",
    [
        "userId",
        "flashcardDeckId",
    ])
export class InterviewAttemptEntity extends UuidAbstractEntity {
    /**
     * The user who answered. Nullable during the enrollment re-key transition;
     * reads/writes go through {@link enrollment} going forward.
     */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_interview_attempts_users",
    })
        user: UserEntity | null

    /** Answering user id. */
    @Column({
        name: "user_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (attempt: InterviewAttemptEntity) => attempt.user,
    )
        userId: string | null

    /**
     * Enrollment this interview attempt belongs to (user × course). The anchor
     * for per-course progress going forward; nullable while the re-key backfill
     * runs.
     */
    @ManyToOne(
        () => EnrollmentEntity,
        {
            onDelete: "CASCADE",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "enrollment_id",
        foreignKeyConstraintName: "fk_enrollment_id_interview_attempts",
    })
        enrollment: EnrollmentEntity | null

    @RelationId(
        (attempt: InterviewAttemptEntity) => attempt.enrollment,
    )
        enrollmentId: string | null

    /** The deck the question was drawn from. */
    @ManyToOne(
        () => FlashcardDeckEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "flashcard_deck_id",
        foreignKeyConstraintName: "fk_flashcard_deck_id_interview_attempts_flashcard_decks",
    })
        flashcardDeck: FlashcardDeckEntity

    /** Deck id the question was drawn from. */
    @Column({
        name: "flashcard_deck_id",
        type: "uuid",
    })
    @RelationId(
        (attempt: InterviewAttemptEntity) => attempt.flashcardDeck,
    )
        flashcardDeckId: string

    /** The graded question card. */
    @ManyToOne(
        () => FlashcardCardEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "flashcard_card_id",
        foreignKeyConstraintName: "fk_flashcard_card_id_interview_attempts_flashcard_cards",
    })
        flashcardCard: FlashcardCardEntity

    /** Graded question card id. */
    @Column({
        name: "flashcard_card_id",
        type: "uuid",
    })
    @RelationId(
        (attempt: InterviewAttemptEntity) => attempt.flashcardCard,
    )
        flashcardCardId: string

    /** Integer 0–100 overall score the model assigned to the answer. */
    @Column({
        name: "score",
        type: "int",
    })
        score: number

    /** Coarse verdict band — "pass" / "borderline" / "fail" (bussiness `InterviewVerdict`). */
    @Column({
        name: "verdict",
        type: "varchar",
    })
        verdict: string

    /** Seniority level of the question at answer time, or null when the card had none. */
    @Column({
        name: "level",
        type: "varchar",
        nullable: true,
    })
        level: string | null

    /** Snapshot of the question's technology tags (drives weak-topic aggregation). */
    @Column({
        name: "tags",
        type: "jsonb",
        default: () => "'[]'",
    })
        tags: Array<string>
}
