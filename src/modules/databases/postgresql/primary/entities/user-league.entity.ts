import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    RelationId,
} from "typeorm"
import {
    LeagueTier,
} from "../enums"
import {
    AbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    LeagueCohortEntity,
} from "./league-cohort.entity"

/**
 * A user's standing in the global weekly league — exactly one row per user.
 *
 * Holds the user's CURRENT tier (the ladder rung they sit on) and a pointer to
 * the {@link LeagueCohortEntity} they are racing in this week (nullable: a user
 * placed before any cohort is formed, or whose cohort is being rebuilt, has no
 * current cohort). The natural primary key is `user_id`, so the table is a flat
 * per-user projection of league state, recomputed only at the weekly reset.
 */
@Entity("user_leagues")
export class UserLeagueEntity extends AbstractEntity {
    /** Owning user id — the natural primary key (one row per user). */
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** The user this league row belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_user_id_user_leagues_users",
    })
        user: UserEntity

    /** The tier the user currently sits on (drives promotion/demotion math). */
    @Column({
        name: "tier",
        type: "enum",
        enum: LeagueTier,
        enumName: "league_tier",
        default: LeagueTier.Bronze,
    })
        tier: LeagueTier

    /** The cohort the user races in this week; null until placed into one. */
    @ManyToOne(
        () => LeagueCohortEntity,
        {
            onDelete: "SET NULL",
            nullable: true,
        },
    )
    @JoinColumn({
        name: "cohort_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_cohort_id_user_leagues_league_cohorts",
    })
        cohort: LeagueCohortEntity | null

    /** Foreign-key id of {@link cohort}; null when the user has no current cohort. */
    @RelationId(
        (userLeague: UserLeagueEntity) => userLeague.cohort,
    )
        cohortId: string | null

    /** Start of the week the user was last (re)assigned to a cohort. */
    @Column({
        name: "joined_week_at",
        type: "timestamptz",
        nullable: true,
    })
        joinedWeekAt: Date | null
}
