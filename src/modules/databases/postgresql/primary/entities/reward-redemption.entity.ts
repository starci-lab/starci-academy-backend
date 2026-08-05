import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    RewardRedemptionStatus,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * Free-form snapshot carried on a {@link RewardRedemptionEntity} row. Holds any
 * ops-relevant context for fulfilment (shipping address, chosen size, etc.)
 * without joining another table. Intentionally untyped (`Record<string, unknown>`)
 * so new physical-reward fields need no schema change.
 */
export type RewardRedemptionMetadata = Record<string, unknown>

@Index(["user"])
@Entity("reward_redemptions")
/**
 * One redemption of a code-defined reward by a user. The `cost` is the snapshot
 * of the reward's price at redeem time (catalog prices can change without
 * rewriting history). The user's spendable balance is DERIVED as
 * `user.coin_balance - SUM(cost WHERE status != 'cancelled')` — coin_balance
 * is NEVER debited here, so the balance that ranks the global leaderboard stays
 * intact.
 */
export class RewardRedemptionEntity extends UuidAbstractEntity {
    /** The user who redeemed the reward. */
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_reward_redemptions_users",
    })
        user: UserEntity

    /** Owning user id. */
    @Column({
        name: "user_id",
        type: "uuid",
    })
    @RelationId(
        (redemption: RewardRedemptionEntity) => redemption.user,
    )
        userId: string

    /** Stable catalog key of the redeemed reward (e.g. "streakFreeze"). */
    @Column({
        name: "reward_key",
        type: "varchar",
        length: 64,
    })
        rewardKey: string

    /** Points cost charged at redeem time (snapshot of the catalog price). */
    @Column({
        name: "cost",
        type: "int",
    })
        cost: number

    /**
     * Lifecycle status: digital rewards land `granted`; physical rewards land
     * `pending` until ops fulfil them. A `cancelled` row is excluded from the
     * spent total (its cost is refunded to the balance).
     */
    @Column({
        name: "status",
        type: "enum",
        enum: RewardRedemptionStatus,
        enumName: "reward_redemption_status",
    })
        status: RewardRedemptionStatus

    /** Optional ops/fulfilment context (shipping, size, …); null for digital. */
    @Column({
        name: "metadata",
        type: "jsonb",
        nullable: true,
    })
        metadata: RewardRedemptionMetadata | null
}
