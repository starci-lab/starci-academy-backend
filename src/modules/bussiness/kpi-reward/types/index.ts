import type {
    KpiKey,
} from "@modules/databases"

/**
 * This KPI's anti-gaming floor state for the current KPI week, as read for
 * display (`myKpis`) or eligibility (`claimKpiReward`).
 */
export interface KpiRewardFloorState {
    /** The lowest target that has been in effect for this KPI so far this week. */
    floorTarget: number
    /** Whether the reward was already claimed this week. */
    claimed: boolean
}

/**
 * Result of a successful KPI-reward claim: the user's refreshed Coin balance
 * and the amount just granted.
 */
export interface ClaimKpiRewardResult {
    /** Coin balance after the grant. */
    balance: number
    /** Coin amount granted by this claim. */
    coinReward: number
}

/** One raw row holding the current KPI week's start instant (as ISO text). */
export interface KpiWeekStartRow {
    /** Start of the current KPI week (Monday 8am Asia/Ho_Chi_Minh), ISO text. */
    weekStart: string
}

/** Params for {@link KpiRewardService.getFloorStates}. */
export interface GetKpiRewardFloorStatesParams {
    /** The user to read floor states for. */
    userId: string
    /** The user's current self-set targets (fallback floor for untouched-this-week KPIs). */
    currentTargets: Partial<Record<KpiKey, number>>
}

/** Params for {@link KpiRewardService.claimReward}. */
export interface ClaimKpiRewardParams {
    /** The claiming user's id. */
    userId: string
    /** Which KPI to claim the reward for. */
    key: KpiKey
}
