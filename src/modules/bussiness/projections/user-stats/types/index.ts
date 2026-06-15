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
    /** Total XP earned in the last 7 days. */
    weeklyXp: number
    /** Number of lessons read in the last 7 days. */
    weeklyLessons: number
}
