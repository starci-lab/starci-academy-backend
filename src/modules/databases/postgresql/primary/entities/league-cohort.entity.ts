import {
    Column,
    Entity,
    Index,
} from "typeorm"
import {
    LeagueTier,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"

@Index(["tier",
    "weekStartAt"])
@Entity("league_cohorts")
/**
 * One weekly competition group ("cohort") for a single {@link LeagueTier}.
 *
 * A cohort is the bucket of up to 30 users who race each other for the same week
 * + tier. It is created at a weekly reset and frozen for the week window
 * `[weekStartAt, weekEndAt)` (Sunday 00:00 -> next Sunday 00:00 Asia/Ho_Chi_Minh).
 * Members rank by their summed `xp_histories.points` in that window; the top 10
 * promote and the bottom 5 demote at the next reset. The composite index on
 * `(tier, weekStartAt)` makes "all cohorts for this tier this week" cheap.
 */
export class LeagueCohortEntity extends UuidAbstractEntity {
    /** Tier this cohort competes in (all members share it for the week). */
    @Column({
        name: "tier",
        type: "enum",
        enum: LeagueTier,
        enumName: "league_tier",
    })
        tier: LeagueTier

    /** Inclusive start of the week window (Sunday 00:00 Asia/Ho_Chi_Minh, stored UTC). */
    @Column({
        name: "week_start_at",
        type: "timestamptz",
    })
        weekStartAt: Date

    /** Exclusive end of the week window (next Sunday 00:00 Asia/Ho_Chi_Minh, stored UTC). */
    @Column({
        name: "week_end_at",
        type: "timestamptz",
    })
        weekEndAt: Date
}
