/**
 * One raw row returned by the race-safe freeze-decrement update
 * (`UPDATE users SET streak_freezes = streak_freezes - 1 ... RETURNING id`).
 * Zero rows means the freeze was spent elsewhere, so the protection is skipped.
 */
export interface StreakFreezeProtectIdRow {
    /** The protected user's id (raw `id` column from `RETURNING id`). */
    id: string
}

/**
 * One row of the auto-protect candidate query: a user that should be
 * auto-protected for yesterday's miss.
 */
export interface StreakFreezeCandidate {
    /** The user to protect (raw `user_id` column). */
    user_id: string
}

/**
 * Result of a successful `buyStreakFreeze`: the user's refreshed freeze
 * inventory and points balance after the atomic spend.
 */
export interface BuyStreakFreezeResult {
    /** The user's streak-freeze count after the purchase. */
    streakFreezes: number
    /** The user's points balance after the purchase. */
    points: number
}
