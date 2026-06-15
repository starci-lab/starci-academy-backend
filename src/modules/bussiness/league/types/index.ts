import type {
    LeagueTier,
} from "@modules/databases"

/**
 * One ranked member of a cohort, as shown in the league standing board.
 */
export interface LeagueStandingMember {
    /** Member's user id. */
    userId: string
    /** Display username (snapshot from the user row); null when unset. */
    username: string | null
    /** Avatar URL; null when the user has no avatar. */
    avatar: string | null
    /** Flat reward points the member earned within the cohort's week window. */
    weekPoints: number
    /** 1-based rank within the cohort, descending by `weekPoints` then user id. */
    rank: number
}

/**
 * The viewer's full league standing — their tier, the ranked members of their
 * current cohort, and the promotion/demotion zone sizes + week deadline used by
 * the UI to draw the cut lines and countdown.
 */
export interface MyStandingResult {
    /** The viewer's current tier. */
    tier: LeagueTier
    /** Ranked members of the viewer's cohort (descending by week points). */
    members: Array<LeagueStandingMember>
    /** How many top members promote at the next reset. */
    promoteCount: number
    /** How many bottom members demote at the next reset. */
    demoteCount: number
    /** Exclusive end of the current week window (the reset deadline). */
    weekEndAt: Date
}

/**
 * Internal row shape returned by the cohort week-points SQL aggregate (one row
 * per cohort member, already ordered for ranking).
 */
export interface CohortMemberPointsRow {
    /** Member's user id. */
    user_id: string
    /** Display username (may be null). */
    username: string | null
    /** Avatar URL (may be null). */
    avatar: string | null
    /** Summed `xp_histories.points` within the cohort's week window. */
    week_points: string | number
}

/**
 * Internal row shape returned by the active-users bucketing SQL at reset time
 * (every user that needs a cohort for the new week, with their target tier and a
 * deterministic shuffle key).
 */
export interface ActiveUserBucketRow {
    /** User id to place into a new-week cohort. */
    user_id: string
    /** The tier (post promote/demote) the user belongs to for the new week. */
    tier: LeagueTier
}
