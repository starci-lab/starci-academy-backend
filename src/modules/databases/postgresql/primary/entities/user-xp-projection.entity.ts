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
 * CQRS projection of a user's XP aggregate — ONE ROW PER user. The inherited
 * jsonb `value` holds `{ challengeXp, milestoneXp, codingXp, lessonXp,
 * totalPoints, coinBalance }`: the per-source XP figures are SUM(amount) of the
 * `xp_histories` ledger GROUP BY source, while `totalPoints` / `coinBalance`
 * snapshot the user's two materialized balances (`users.total_points` /
 * `users.coin_balance`). The heavy GROUP BY runs only in the projection's
 * recompute, never inline at read time. Read with a TTL lazy-refresh; kept fresh
 * by CDC on `xp_histories` + `users`.
 */
@Entity("user_xp_projections")
export class UserXpProjectionEntity extends AbstractProjectionEntity {
    /** Target user id — the natural (primary) key. */
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
        foreignKeyConstraintName: "fk_user_id_user_xp_projections_users",
    })
        user: UserEntity
}
