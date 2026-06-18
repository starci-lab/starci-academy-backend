import {
    DiscountReason,
} from "@modules/databases"

/** Row shape for the enrolled-courses count query. */
export interface EnrolledCountRow {
    /** Number of courses the user is already enrolled in. */
    count: string
}

/**
 * The computed loyalty discount for a user: the percent to apply, why it
 * applies, and the enrolled-course count that fed the calculation (kept for FE
 * copy such as "5% per owned course").
 */
export interface LoyaltyDiscountResult {
    /** Discount percent to apply to the price (0–30). */
    percent: number
    /** Why the discount applies (drives FE copy). */
    reason: DiscountReason
    /** Number of courses the user already owns/enrolled. */
    enrolledCount: number
}
