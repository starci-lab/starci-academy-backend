import type {
    RewardRedemptionEntity,
    RewardRedemptionStatus,
} from "@modules/databases"

/**
 * Whether a reward is delivered instantly (digital, status `granted`), must be
 * physically fulfilled by ops (physical, status `pending`), mints a checkout
 * discount voucher (voucher, status `granted`), or tops up the redeemer's AI
 * credit allowance for the current window (aiCredit, status `granted`).
 */
export type RewardKind = "digital" | "physical" | "voucher" | "aiCredit"

/** How a `voucher`-kind reward discounts a course price. */
export type VoucherDiscountKind = "percent" | "flat"

/**
 * Voucher-kind config: the discount it mints + how long the minted code stays
 * redeemable. `value` is a percent (0-100) when `discountType` is `"percent"`,
 * or a flat VND amount when `"flat"`.
 */
export interface RewardVoucherConfig {
    /** Percent-off or flat-VND-off. */
    discountType: VoucherDiscountKind
    /** Percent (0-100) or flat VND amount, depending on `discountType`. */
    value: number
    /** Days the minted code stays redeemable after granting (from `now()`). */
    validityDays: number
}

/**
 * AiCredit-kind config: the bonus platform credit granted on top of the
 * redeemer's tier allowance for the CURRENT 5h + weekly window (the bonus is
 * NOT a permanent allowance bump -- it resets to 0 the same time the window
 * counters reset, same as buying "more credit for this cycle").
 */
export interface RewardAiCreditConfig {
    /** Bonus credit added to the current 5-hour window's allowance. */
    amount5h: number
    /** Bonus credit added to the current weekly window's allowance. */
    amountWeek: number
}

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
    /** Delivery kind -- drives the initial redemption status + effect. */
    kind: RewardKind
    /** Present only when `kind === "voucher"`: the discount it mints. */
    voucher?: RewardVoucherConfig
    /** Present only when `kind === "aiCredit"`: the bonus credit it grants. */
    aiCredit?: RewardAiCreditConfig
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
    /** Delivery kind (`digital` | `physical` | `voucher` | `aiCredit`). */
    kind: RewardKind
    /** Present only when `kind === "voucher"`: the discount it mints. */
    voucher?: RewardVoucherConfig
    /** Present only when `kind === "aiCredit"`: the bonus credit it grants. */
    aiCredit?: RewardAiCreditConfig
}

/**
 * The viewer's reward wallet: spendable balance, lifetime spent, and history.
 */
export interface RewardWalletResult {
    /** Spendable balance = `user.coin_balance - spent` (never negative in practice). */
    balance: number
    /** Sum of cost across the viewer's non-cancelled redemptions. */
    spent: number
    /** The viewer's redemptions, newest-first. */
    redemptions: Array<RewardRedemptionEntity>
}

/** Params for {@link RewardsService.redeem}. */
export interface RedeemRewardParams {
    /** The redeeming user's id. */
    userId: string
    /** The catalog key of the reward to redeem. */
    rewardKey: string
    /** Shipping details for a `physical`-kind reward. Ignored for every other kind. */
    shipping?: RewardShippingInput
}

/**
 * Result of a successful redemption: the viewer's refreshed spendable balance,
 * streak-freeze inventory (only changes for `streakFreeze`), the minted
 * voucher code (only for `kind === "voucher"`), and the granted bonus credit
 * (only for `kind === "aiCredit"`).
 */
export interface RedeemRewardResult {
    /** Spendable Coin balance after the redemption. */
    balance: number
    /** The user's streak-freeze count after the redemption. */
    streakFreezes: number
    /** The freshly-minted voucher code, when the redeemed reward is `kind: "voucher"`. */
    voucherCode?: string
    /** The bonus credit granted this window, when the redeemed reward is `kind: "aiCredit"`. */
    aiCreditGranted?: RewardAiCreditConfig
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
