import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing one user's XP projection row. */
export interface RecomputeUserXpParams {
    /** The user whose XP aggregate to rebuild. */
    userId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/**
 * CDC row from `xp_histories` (a ledger row moves the earner's XP aggregate).
 */
export interface UserXpHistoryCdcRow {
    /** The user who earned the XP. */
    user_id?: string
}

/**
 * CDC row from `users` (a balance change moves the user's XP aggregate snapshot).
 */
export interface UserXpUserCdcRow {
    /** Primary-key id of the changed user row. */
    id?: string
}

/** Params for reading one user's XP aggregate. */
export interface UserXpParams {
    /** The user whose XP aggregate to read. */
    userId: string
}

/**
 * The XP aggregate returned by {@link UserXpProjectionService.getXp}: the
 * per-source XP totals derived from the `xp_histories` ledger plus the two
 * materialized balances snapshotted from the `users` row.
 */
export interface UserXpResult {
    /** Total XP earned from passed challenges (SUM amount WHERE source = challenge). */
    challengeXp: number
    /** Total XP earned from passed milestone tasks (SUM amount WHERE source = milestone). */
    milestoneXp: number
    /** Total XP earned from solved coding problems (SUM amount WHERE source = coding). */
    codingXp: number
    /** Total XP earned from read lessons (SUM amount WHERE source = lessonRead). */
    lessonXp: number
    /** The user's total lifetime XP balance (`users.total_points`). */
    totalPoints: number
    /** The user's spendable Coin balance (`users.coin_balance`). */
    coinBalance: number
}
