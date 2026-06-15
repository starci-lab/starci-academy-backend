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

/**
 * CQRS projection of a user's achievement wall, ONE ROW PER user. The inherited
 * jsonb `value` holds `{ data: [...achievements], count }` — the computed badge
 * list + earned count. Reads return this flat row (TTL lazy-refresh as the safety
 * net); the achievement CDC listener INVALIDATES the row (hard delete) whenever a
 * source metric changes, so the next read recomputes + re-awards on the spot.
 */
@Entity("user_achievement_projections")
export class UserAchievementProjectionEntity extends AbstractProjectionEntity {
    /** Target user id — the primary key. */
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** The user this wall belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_user_id_user_achievement_projections_users",
    })
        user: UserEntity
}
