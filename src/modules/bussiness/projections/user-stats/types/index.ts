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
 * Flat social + inbox counters for a user — the typed view parsed out of the
 * projection's jsonb `value`.
 */
export interface UserStatsResult {
    /** People who follow this user. */
    followerCount: number
    /** People this user follows. */
    followingCount: number
    /** Unread notifications (the bell badge value). */
    unreadNotificationCount: number
}
