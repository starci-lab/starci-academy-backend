import {
    DiscountReason,
} from "@modules/databases"

/** Row shape for the enrolled-courses count query. */
export interface EnrolledCountRow {
    /** Number of courses the user is already enrolled in. */
    count: string
}

/**
 * Params for computing a user's engagement-based loyalty discount.
 */
export interface ComputeLoyaltyDiscountParams {
    /** The user to price for. */
    userId: string
    /**
     * Extra courses to treat as already owned on top of the real enrolled count —
     * lets a multi-course checkout price line N as if lines `0..N-1` of the SAME
     * order were already bought, matching what the buyer would get checking out
     * sequentially instead of in one cart. Defaults to 0 (single-course checkouts,
     * previews, and recommendations all use the real count only).
     */
    extraOwnedCount?: number
}

/**
 * The two DB-derived inputs to the loyalty percent, fetched ONCE per user so a
 * multi-course checkout can price every line without re-querying: the count of
 * courses the user already owns, and whether they are "diligent". Everything the
 * percent needs beyond these is pure arithmetic ({@link ResolveLoyaltyPercentParams}).
 */
export interface LoyaltyContext {
    /** Courses the user already owns/enrolled (the bundle/loyalty signal). */
    ownedCount: number
    /** Whether the user qualifies as diligent (streak >= 7 OR total points >= 1000). */
    diligent: boolean
}

/**
 * Params for deriving a loyalty percent from an already-fetched {@link LoyaltyContext}
 * — the pure, DB-free half of the computation.
 */
export interface ResolveLoyaltyPercentParams {
    /** The user's DB-derived loyalty inputs (fetched once). */
    context: LoyaltyContext
    /**
     * Extra courses to treat as owned on top of {@link LoyaltyContext.ownedCount},
     * so a multi-course checkout can price line N as if the N earlier lines of the
     * SAME order were already bought. Defaults to 0. MUST be non-negative — every
     * current caller passes a cart-line index so this is not reachable today, but
     * the value is not floored, so a negative caller would silently under-discount
     * rather than throw.
     */
    extraOwnedCount?: number
}

/**
 * The computed loyalty discount for a user: the percent to apply, why it
 * applies, and the enrolled-course count that fed the calculation (kept for FE
 * copy such as "5% per owned course").
 */
export interface LoyaltyDiscountResult {
    /** Discount percent to apply to the price (0–30, before any bundle bonus). */
    percent: number
    /** Why the discount applies (drives FE copy). */
    reason: DiscountReason
    /** Number of courses counted as owned for this computation (real count + any `extraOwnedCount`). */
    enrolledCount: number
}

/**
 * Params for combining a per-course loyalty percent with the checkout's bundle
 * bonus into the final percent charged for one line.
 */
export interface ApplyBundleBonusParams {
    /** The line's base loyalty percent from {@link LoyaltyDiscountResult.percent}. */
    basePercent: number
    /** Number of distinct courses in the order (drives the bundle tier). */
    itemCount: number
}
