import type {
    EntityManager,
} from "typeorm"

/**
 * Params for recomputing one user's stats projection row.
 */
export interface RecomputeUserStatsParams {
    /** The user whose social + inbox counters to rebuild. */
    userId: string
    /**
     * Caller's transaction manager — pass it from an inline write so the
     * projection commits atomically with the source change; omit for the CDC path.
     */
    entityManager?: EntityManager
}

/**
 * One day in the "last 7 days" streak strip — whether the user was active
 * (earned any XP) on that calendar day.
 */
export interface StreakDay {
    /** Calendar day, `YYYY-MM-DD` (oldest → today). */
    date: string
    /** True when the user earned any XP that day. */
    active: boolean
}

/**
 * Flat per-user stats — the typed view parsed out of the projection's jsonb
 * `value`. Holds both point-in-time social/inbox counters and rolling activity
 * metrics (kept fresh on XP events via CDC + a TTL lazy-refresh on read).
 */
export interface UserStatsResult {
    /** People who follow this user. */
    followerCount: number
    /** People this user follows. */
    followingCount: number
    /** Unread notifications (the bell badge value). */
    unreadNotificationCount: number
    /** Consecutive days (up to today) with at least one XP event. */
    streak: number
    /** Longest-ever consecutive-day streak. */
    longestStreak: number
    /** Total XP earned in the last 7 days. */
    weeklyXp: number
    /** Number of lessons read in the last 7 days. */
    weeklyLessons: number
    /** The last 7 calendar days (oldest → today) flagged active. */
    last7Days: Array<StreakDay>
}
