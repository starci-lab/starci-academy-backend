import {
    Column,
    Entity,
    Index,
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
import type {
    KpiKey,
} from "../enums/kpi-key"

@Index(["user"])
@Unique(
    "uq_kpi_weekly_reward_floors_user_kpi_week",
    [
        "userId",
        "kpiKey",
        "weekStartAt",
    ],
)
@Entity("kpi_weekly_reward_floors")
/**
 * One per (user, KPI, KPI-week): the anti-gaming FLOOR target for that KPI this
 * week, plus (once claimed) the coin-reward snapshot. `floor_target` starts at
 * whatever target was in effect the first time it's touched this week, then can
 * only move DOWN (`LEAST`) on every subsequent `setKpiTarget` call during the
 * SAME week — so raising a target AFTER already exceeding a lower one cannot
 * inflate the reward for work already done. A week where the user never calls
 * `setKpiTarget` has NO row here; the claim falls back to the user's current
 * `weekly_kpi_targets` value (safe — it hasn't moved all week either).
 *
 * `week_start_at` uses the SAME Monday-8am-Asia/Ho_Chi_Minh boundary as the
 * KPI weekly-reset window (`user-stats-projection.service.ts`'s
 * `KPI_WEEK_START_SQL`) so the two concepts of "week" never drift apart.
 * `claimed_at`/`coin_reward` are null until the reward is claimed; the unique
 * constraint is the idempotency backstop against a double claim.
 */
export class KpiWeeklyRewardFloorEntity extends UuidAbstractEntity {
    /** The user this floor/claim row belongs to. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_kpi_weekly_reward_floors_users",
    })
        user: UserEntity

    /** Owning user id. */
    @Column({
        name: "user_id",
        type: "uuid",
    })
    @RelationId(
        (floor: KpiWeeklyRewardFloorEntity) => floor.user,
    )
        userId: string

    /**
     * Which KPI this row tracks. Stored as plain `varchar` (NOT a native Postgres
     * enum) so adding a 7th KPI key later never risks the enum-ADD-VALUE /
     * synchronize-DROP-TYPE trap that a shared native enum column would.
     */
    @Column({
        name: "kpi_key",
        type: "varchar",
    })
        kpiKey: KpiKey

    /** Start of the KPI week this row tracks (Monday 8am Asia/Ho_Chi_Minh). */
    @Column({
        name: "week_start_at",
        type: "timestamptz",
    })
        weekStartAt: Date

    /** The lowest target that has been in effect for this KPI so far this week. */
    @Column({
        name: "floor_target",
        type: "int",
    })
        floorTarget: number

    /** When the reward was claimed; null while still unclaimed. */
    @Column({
        name: "claimed_at",
        type: "timestamptz",
        nullable: true,
    })
        claimedAt: Date | null

    /** Coin granted by the claim (snapshot — the catalog value can change later). */
    @Column({
        name: "coin_reward",
        type: "int",
        nullable: true,
    })
        coinReward: number | null
}
