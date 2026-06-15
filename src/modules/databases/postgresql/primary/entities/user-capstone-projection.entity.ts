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
 * CQRS projection of a user's passed capstone (personal-project milestone) tasks —
 * ONE ROW PER user. The inherited jsonb `value` holds `{ tasks: [{ courseId,
 * courseTitle, milestoneTitle, taskTitle, score, passedAt }] }`, recomputed from
 * the `user_milestone_task_attempts` ledger (DISTINCT-ON join). Read with a TTL
 * lazy-refresh; kept fresh by CDC on `user_milestone_task_attempts`.
 */
@Entity("user_capstone_projections")
export class UserCapstoneProjectionEntity extends AbstractProjectionEntity {
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
        foreignKeyConstraintName: "fk_user_id_user_capstone_projections_users",
    })
        user: UserEntity
}
