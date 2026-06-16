import type {
    MyAchievementResult,
} from "./index"

/**
 * Cached snapshot value stored in the achievements CQRS projection row. The
 * projection persists the precomputed achievement wall as JSON; this is the
 * shape read back out of `UserAchievementProjectionEntity.value` on a fresh
 * cache hit before hydration.
 */
export interface CachedMyAchievementsValue {
    /**
     * The serialized achievement list as it was at write time; optional because
     * a malformed / legacy row may not carry it (defaults to an empty list).
     */
    data?: Array<MyAchievementResult>
    /**
     * The earned count captured at write time; optional for the same legacy
     * reason (defaults to 0).
     */
    count?: number
}

/**
 * Per-achievement aggregate folded from a user's award ledger: the earliest time
 * any tier was earned and the highest tier reached. Used as the value type of
 * the achievement-id-keyed map returned by the earned-ledger fold.
 */
export interface EarnedAchievementEntry {
    /** The earliest `earnedAt` across the user's awards for this achievement. */
    earnedAt: Date
    /** The highest tier reached (1-based), or null for single-tier / not tiered. */
    tier: number | null
}
