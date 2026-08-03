/** Cached AI credit usage snapshot for a user (source of truth: `credit_usage_histories`). */
export interface CreditUsageCacheResult {
    /** Credits consumed within the rolling week window. */
    usedCreditsWeek: number
    /** Epoch ms when the oldest week-window charge ages out; null when no usage. */
    resetAtWeekMs: number | null
    /** Credits consumed within the rolling 5-hour window. */
    usedCredits5h: number
    /** Epoch ms when the oldest 5h-window charge ages out; null when no usage. */
    resetAt5hMs: number | null
}
