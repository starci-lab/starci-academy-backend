import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

@Entity("streak_protected_days")
// one protection row per user per calendar day (idempotent cron insert)
@Unique("uq_streak_protected_days_user_date",
    [
        "userId",
        "date",
    ])
/**
 * A single calendar day whose streak is protected for a user by a consumed
 * streak freeze. The user-stats streak recompute UNIONs these days into the
 * active-day set, so a protected day keeps a streak alive even with no real
 * activity. Written by the daily `consumeStreakFreezeForMisses` cron (and is the
 * ONLY additive input to the otherwise-stateless streak walk).
 */
export class StreakProtectedDayEntity extends UuidAbstractEntity {
    /** The user whose streak this day protects. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_streak_protected_days_users",
    })
        user: UserEntity

    /** Owning user id. */
    @Column({
        name: "user_id",
        type: "uuid",
    })
    @RelationId(
        (protectedDay: StreakProtectedDayEntity) => protectedDay.user,
    )
        userId: string

    /** The protected calendar day (date-only, no time component). */
    @Column({
        name: "date",
        type: "date",
    })
        date: string
}
