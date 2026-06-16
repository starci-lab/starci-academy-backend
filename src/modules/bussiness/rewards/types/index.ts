import type {
    RewardRedemptionEntity,
    RewardRedemptionStatus,
} from "@modules/databases"

/**
 * Whether a reward is delivered instantly (digital, status `granted`) or must
 * be physically fulfilled by ops (physical, status `pending`).
 */
export type RewardKind = "digital" | "physical"

/**
 * One code-defined reward in the catalog. Prices and copy live in code (no DB
 * table) so the catalog is a single source of truth that ships with the build.
 */
export interface RewardDefinition {
    /** Stable key persisted on redemption rows + used by the FE to redeem. */
    key: string
    /** English display title. */
    titleEn: string
    /** Vietnamese display title. */
    titleVi: string
    /** English description. */
    descEn: string
    /** Vietnamese description. */
    descVi: string
    /** Points cost to redeem. */
    cost: number
    /** Delivery kind — drives the initial redemption status. */
    kind: RewardKind
}

/**
 * A catalog reward localized to a single locale, ready for the GraphQL layer.
 */
export interface LocalizedReward {
    /** Stable catalog key. */
    key: string
    /** Title resolved to the request locale. */
    title: string
    /** Description resolved to the request locale. */
    description: string
    /** Points cost to redeem. */
    cost: number
    /** Delivery kind (`digital` | `physical`). */
    kind: RewardKind
}

/**
 * The viewer's reward wallet: spendable balance, lifetime spent, and history.
 */
export interface RewardWalletResult {
    /** Spendable balance = `user.points - spent` (never negative in practice). */
    balance: number
    /** Sum of cost across the viewer's non-cancelled redemptions. */
    spent: number
    /** The viewer's redemptions, newest-first. */
    redemptions: Array<RewardRedemptionEntity>
}

/** Params for {@link RewardsService.redeemReward}. */
export interface RedeemRewardParams {
    /** The redeeming user's id. */
    userId: string
    /** The catalog key of the reward to redeem. */
    rewardKey: string
}

/**
 * Result of a successful redemption: the viewer's refreshed spendable balance
 * and streak-freeze inventory (the latter only changes for `streakFreeze`).
 */
export interface RedeemRewardResult {
    /** Spendable reward-points balance after the redemption. */
    balance: number
    /** The user's streak-freeze count after the redemption. */
    streakFreezes: number
}

/**
 * One raw aggregate row from the redemption-cost sum query
 * (`SELECT COALESCE(SUM(cost), 0) AS sum`). The value is a string because
 * Postgres returns `numeric`/`bigint` aggregates as text over the wire.
 */
export interface RewardSumRow {
    /** Total non-cancelled redemption cost, as a numeric string. */
    sum: string
}

/** Optional shipping details captured when redeeming a physical reward. */
export interface RewardShippingInput {
    /** Recipient name. */
    recipientName?: string
    /** Contact phone. */
    phone?: string
    /** Shipping address. */
    address?: string
}

/** Re-export the persisted status type for convenience in the service. */
export type { RewardRedemptionStatus }
