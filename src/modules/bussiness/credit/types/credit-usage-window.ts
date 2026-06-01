/**
 * Credit usage for one rolling time window (5 hours or 7 days).
 */
export interface CreditUsageWindowSnapshot {
    /** Credits consumed inside the window. */
    usedCredits: number
    /** Credit cap for the window. */
    quota: number
    /** Credits left before hitting the cap (never negative). */
    remainingCredits: number
    /** When the oldest in-window charge ages out; null when no usage. */
    resetAt: Date | null
}
