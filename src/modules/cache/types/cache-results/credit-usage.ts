/** Cached AI credit usage snapshot for a user (source of truth: `credit_usage_histories`). */
export interface CreditUsageCacheResult {
    /** Credits consumed within the current rolling window. */
    usedCredits: number
    /** Epoch ms when the oldest in-window charge ages out (quota starts recovering); null when no usage. */
    resetAtMs: number | null
}
