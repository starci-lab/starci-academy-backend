import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
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
    GraphQLTypeCoinSource,
    CoinSource,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * Append-only audit ledger of Coin a user was granted — SEPARATE from
 * {@link XpHistoryEntity} (real, weighted XP): every row here is a flat,
 * course-agnostic coin-only reward (daily quest, streak bonus, KPI reward,
 * weekly-challenge reward — see {@link CoinSource}). Split out so "XP history"
 * (`myXpHistory`) stays real XP only, and this ledger's own idempotency
 * (`(source, refId)` unique) covers coin grants independently.
 *
 * `source` is a plain `varchar` (NOT a native Postgres enum) — deliberately,
 * so adding a future coin-only source never risks the enum-ADD-VALUE /
 * synchronize-DROP-TYPE trap that a shared native enum column would (see
 * `KpiWeeklyRewardFloorEntity.kpiKey` for the same choice).
 */
@ObjectType({
    description: "Append-only record of Coin granted to a user (coin-only, never XP).",
})
@Unique(["source",
    "refId"])
@Index(["user"])
@Entity("coin_histories")
export class CoinHistoryEntity extends UuidAbstractEntity {
    /** User who was granted the Coin. */
    @Field(
        () => UserEntity,
        {
            description: "User who was granted the Coin.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_coin_histories_users",
    })
        user: UserEntity

    /** User ID who was granted the Coin. */
    @Field(
        () => ID,
        {
            description: "User ID who was granted the Coin.",
        },
    )
    @RelationId(
        (coinHistory: CoinHistoryEntity) => coinHistory.user,
    )
        userId: string

    /** Where the Coin came from (dailyQuest / streakMilestone / kpiReward / ...). */
    @Field(
        () => GraphQLTypeCoinSource,
        {
            description: "Where the Coin came from.",
        },
    )
    @Column({
        name: "source",
        type: "varchar",
        length: 32,
    })
        source: CoinSource

    /** Coin granted by this event. */
    @Field(
        () => Int,
        {
            description: "Coin granted by this event.",
        },
    )
    @Column({
        name: "points",
        type: "int",
    })
        points: number

    /**
     * Stable id of the originating grant (e.g. `kpi:lessons:2026-07-13T08:00:00.000Z`).
     * Combined with `source`, makes each grant idempotent (unique).
     */
    @Field(
        () => ID,
        {
            description: "Id of the originating event that produced this Coin grant.",
        },
    )
    @Column({
        name: "ref_id",
        type: "varchar",
        length: 64,
    })
        refId: string
}
