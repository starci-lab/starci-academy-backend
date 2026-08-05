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
    FlashcardCardEntity,
} from "./flashcard-card.entity"

@Entity("user_flashcard_reviews")
// fast lookup of a user's review rows (and their due-ness) for the due queue
@Index("idx_user_flashcard_reviews_user_due",
    [
        "userId",
        "dueAt",
    ])
/**
 * Spaced-repetition (SM-2) review state for one user × one flashcard card. Holds
 * the SM-2 scheduling fields (ease / interval / repetitions) plus the computed
 * `dueAt` that drives the "due cards" queue. One row is upserted per
 * (user, card) on each `reviewFlashcard` mutation; a card with NO row yet is
 * treated as brand-new (immediately due).
 */
export class UserFlashcardReviewEntity extends UuidAbstractEntity {
    /**
     * The user this review state belongs to. Nullable during the enrollment
     * re-key transition; reads/writes go through {@link enrollment} going forward.
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
        foreignKeyConstraintName: "fk_user_id_user_flashcard_reviews_users",
    })
        user: UserEntity | null

    /** Owning user id. */
    @Column({
        name: "user_id",
        type: "uuid",
        nullable: true,
    })
    @RelationId(
        (review: UserFlashcardReviewEntity) => review.user,
    )
        userId: string | null

    /**
     * Enrollment this review state belongs to (user × course). The anchor for
     * per-course progress going forward; nullable while the re-key backfill runs.
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
        foreignKeyConstraintName: "fk_enrollment_id_user_flashcard_reviews",
    })
        enrollment: EnrollmentEntity | null

    @RelationId(
        (review: UserFlashcardReviewEntity) => review.enrollment,
    )
        enrollmentId: string | null

    /** The flashcard card being scheduled. */
    @ManyToOne(
        () => FlashcardCardEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "flashcard_card_id",
        foreignKeyConstraintName: "fk_flashcard_card_id_user_flashcard_reviews_flashcard_cards",
    })
        flashcardCard: FlashcardCardEntity

    /** Scheduled flashcard card id. */
    @Column({
        name: "flashcard_card_id",
        type: "uuid",
    })
    @RelationId(
        (review: UserFlashcardReviewEntity) => review.flashcardCard,
    )
        flashcardCardId: string

    /** SM-2 easiness factor (floor 1.3, starts at 2.5). */
    @Column({
        name: "ease",
        type: "float",
        default: 2.5,
    })
        ease: number

    /** Current inter-review interval in days. */
    @Column({
        name: "interval_days",
        type: "int",
        default: 0,
    })
        intervalDays: number

    /** Number of consecutive successful repetitions (reset to 0 on "Again"). */
    @Column({
        name: "repetitions",
        type: "int",
        default: 0,
    })
        repetitions: number

    /** When the card next becomes due (null = never reviewed → immediately due). */
    @Column({
        name: "due_at",
        type: "timestamptz",
        nullable: true,
    })
        dueAt: Date | null

    /** When the card was last reviewed (null until the first review). */
    @Column({
        name: "last_reviewed_at",
        type: "timestamptz",
        nullable: true,
    })
        lastReviewedAt: Date | null
}
