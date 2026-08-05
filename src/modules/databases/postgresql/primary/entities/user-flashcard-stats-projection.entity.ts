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
    UserEntity,
} from "./user.entity"

@Entity("user_flashcard_stats_projections")
/**
 * CQRS projection of a user's flashcard study stats -- ONE ROW PER user. The
 * inherited jsonb `value` holds `{ currentStreak, longestStreak, retentionRate,
 * totalReviewed, lastReviewedAt }`, all derived from the `flashcard_review_events`
 * log. The history scan runs only in the projection's recompute, never inline at
 * read time. Read with a TTL lazy-refresh; kept fresh by CDC on
 * `flashcard_review_events`.
 */
export class UserFlashcardStatsProjectionEntity extends AbstractProjectionEntity {
    /** Target user id -- the natural (primary) key. */
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** The user this projection belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_user_id_user_flashcard_stats_projections_users",
    })
        user: UserEntity
}
