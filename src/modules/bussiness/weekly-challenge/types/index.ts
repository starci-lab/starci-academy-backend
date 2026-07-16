/**
 * One id row from the deterministic challenge pick
 * (`SELECT c.id, c.title ... OFFSET ... LIMIT 1`).
 */
export interface ChallengeIdRow {
    /** Challenge id (uuid). */
    id: string
    /** Challenge title. */
    title: string
}

/**
 * One leaderboard row from the windowed passers query
 * (this week's passing attempts, newest first).
 */
export interface LeaderboardRow {
    /** Passer username (display handle). */
    username: string | null
    /** Passer avatar URL. */
    avatar: string | null
    /** When they passed this week. */
    passed_at: Date
}

/**
 * One raw row from the week-end computation query
 * (`SELECT ... AS week_end`), giving the inclusive end of the current ISO week.
 */
export interface WeekEndRow {
    /** End of the current ISO week (Sunday 23:59:59.999), as a raw DB timestamp. */
    week_end: Date
}

/**
 * One raw row from the week-start computation query (`SELECT ... AS week_start`),
 * giving the start of the current ISO week (Monday 00:00).
 */
export interface WeekStartRow {
    /** Start of the current ISO week, as a raw DB timestamp. */
    week_start: Date
}

/**
 * Result of a successful weekly-challenge reward claim: the user's refreshed
 * Coin balance and the amount just granted.
 */
export interface ClaimWeeklyChallengeResult {
    /** Coin balance after the grant. */
    balance: number
    /** Coin amount granted by this claim. */
    coinReward: number
}

/**
 * One raw row from the viewer-passed `EXISTS(...)` query, telling whether the
 * viewer has a qualifying passing attempt this week.
 */
export interface ViewerPassedRow {
    /** True when the viewer passed the challenge within the current ISO week. */
    ok: boolean
}

/**
 * One leaderboard entry for the weekly challenge: a user who passed it this week.
 */
export interface WeeklyChallengeEntry {
    /** Username (display handle). */
    username: string
    /** Avatar URL, or null. */
    avatar: string | null
    /** When the user passed the challenge this week. */
    passedAt: Date
}

/**
 * The current week's challenge event view (null when there are no challenges).
 */
export interface WeeklyChallenge {
    /** Global (relay) id of the picked challenge. */
    challengeGlobalId: string
    /** Challenge title. */
    title: string
    /** End of the current ISO week (Sunday 23:59:59.999). */
    weekEndAt: Date
    /** Whether the authed viewer passed it this week (false when anonymous). */
    viewerPassed: boolean
    /** Total number of users who passed it this week. */
    passedCount: number
    /** Up to ~10 most-recent passers this week (newest first). */
    leaderboard: Array<WeeklyChallengeEntry>
    /** Whether the viewer already claimed the reward this week (false when anonymous/not passed). */
    claimed: boolean
    /** Coin reward for claiming; null when the viewer hasn't passed (nothing to claim yet). */
    coinReward: number | null
}
