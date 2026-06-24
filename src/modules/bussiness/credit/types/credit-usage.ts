import type {
    AiMode,
} from "@modules/databases"
import type {
    CreditUsageWindowSnapshot,
} from "./credit-usage-window"

/**
 * Used / quota / remaining credit snapshot for a user (Auto lane rolling windows).
 */
export interface CreditUsageSnapshot {
    /** Week-window used credits (same as {@link CreditUsageSnapshot.windowWeek}). */
    usedCredits: number
    /** Week-window cap (same as {@link CreditUsageSnapshot.windowWeek}). */
    quota: number
    /** Week-window remaining (same as {@link CreditUsageSnapshot.windowWeek}). */
    remainingCredits: number
    /** Whether the week-window cap is exhausted. */
    overQuota: boolean
    /** Week-window recovery time (same as {@link CreditUsageSnapshot.windowWeek}). */
    resetAt: Date | null
    /** Credits used / cap within the rolling 5-hour window. */
    window5h: CreditUsageWindowSnapshot
    /** Credits used / cap within the rolling 7-day window. */
    windowWeek: CreditUsageWindowSnapshot
}

/** One AI credit charge row for the usage history list. */
export interface CreditUsageHistoryItem {
    /** Charge row id. */
    id: string
    /** AI lane the charge was billed on (auto / premium / byok). */
    mode: AiMode
    /** Premium tier billed (low / medium / high); null for auto / byok. */
    recommendation: string | null
    /** Concrete model billed (e.g. gpt-5-mini); null for the free Auto lane. */
    model: string | null
    /** Provider of the billed model (gemini / openai); null for the free Auto lane. */
    provider: string | null
    /** Credits charged for this run. */
    credits: number
    /** When the charge was recorded. */
    createdAt: Date
}

/** A page of AI credit charge rows plus the total count. */
export interface CreditUsageHistoryPage {
    /** The charge rows for the requested page, newest first. */
    items: Array<CreditUsageHistoryItem>
    /** Total number of charge rows for the user (across all pages). */
    total: number
}

/** Raw usage totals loaded from DB / cache. */
export interface CreditUsageTotals {
    /** Credits summed inside the 5-hour window. */
    usedCredits5h: number
    /** Credits summed inside the week window. */
    usedCreditsWeek: number
    /** Recovery time for the 5-hour window. */
    resetAt5hMs: number | null
    /** Recovery time for the week window. */
    resetAtWeekMs: number | null
}
