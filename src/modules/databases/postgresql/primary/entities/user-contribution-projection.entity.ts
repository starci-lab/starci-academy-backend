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

@Entity("user_contribution_projections")
/**
 * CQRS projection of a user's GitHub-style contribution calendar, ONE ROW PER
 * (user, calendar year) — GitHub renders a single year at a time and lets you flip
 * between years, so each year is stored + read independently. Composite key is
 * `(user_id, year)`; the inherited jsonb `value` holds `{ days: [{ date, contents,
 * challenges, milestones }] }` for that year. The current year is read with a TTL
 * lazy-refresh (it still grows); past years are immutable once recomputed.
 */
export class UserContributionProjectionEntity extends AbstractProjectionEntity {
    /** Target user id — part of the composite primary key. */
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** Calendar year (e.g. 2025) — part of the composite primary key. */
    @PrimaryColumn({
        name: "year",
        type: "int",
    })
        year: number

    /** The user this calendar belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_user_id_user_contribution_projections_users",
    })
        user: UserEntity
}
