import {
    Field,
    ID,
} from "@nestjs/graphql"
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
    FlashcardCardEntity,
} from "./flashcard-card.entity"

@Entity("flashcard_review_events")
// fast scan of a user's review history, ordered by time (streak / retention)
@Index("idx_flashcard_review_events_user_reviewed",
    [
        "userId",
        "reviewedAt",
    ])
// fast aggregate of every event graded within one review session (per-session stats)
@Index("idx_flashcard_review_events_session",
    [
        "sessionId",
    ])
/**
 * Append-only log of every flashcard review the user has graded. Unlike
 * {@link UserFlashcardReviewEntity} (which keeps only the CURRENT SM-2 state per
 * card), this records each grading event (grade + timestamp) so history-based
 * stats — review streak, retention rate, total reviewed — can be computed. One
 * row is appended per `reviewFlashcard` mutation; CDC on this table refreshes the
 * `user_flashcard_stats` projection.
 */
export class FlashcardReviewEventEntity extends UuidAbstractEntity {
    /** The user who graded the review. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_flashcard_review_events_users",
    })
        user: UserEntity

    /** Reviewer user id. */
    @Column({
        name: "user_id",
        type: "uuid",
    })
    @RelationId(
        (event: FlashcardReviewEventEntity) => event.user,
    )
        userId: string

    /** The flashcard card that was reviewed. */
    @ManyToOne(
        () => FlashcardCardEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "flashcard_card_id",
        foreignKeyConstraintName: "fk_flashcard_card_id_flashcard_review_events_flashcard_cards",
    })
        flashcardCard: FlashcardCardEntity

    /** Reviewed flashcard card id. */
    @Column({
        name: "flashcard_card_id",
        type: "uuid",
    })
    @RelationId(
        (event: FlashcardReviewEventEntity) => event.flashcardCard,
    )
        flashcardCardId: string

    /** SM-2 grade given: 0=Again, 1=Hard, 2=Good, 3=Easy. */
    @Column({
        name: "grade",
        type: "int",
    })
        grade: number

    /** When the review was graded. */
    @Column({
        name: "reviewed_at",
        type: "timestamptz",
    })
        reviewedAt: Date

    /**
     * The review session this grade was graded within, when the client threaded a
     * session id (deck-review or due-review). Nullable so pre-existing events (and
     * any grade made outside a tracked session) stay valid — a session with no
     * events carrying its id falls back to `reviewedCount`-only stats.
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "The review session this grade belongs to (null for untracked grades).",
        },
    )
    @Column({
        name: "session_id",
        type: "uuid",
        nullable: true,
    })
        sessionId: string | null
}
