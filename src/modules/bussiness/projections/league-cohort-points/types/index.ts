import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing one cohort's ranked week-points board. */
export interface RecomputeLeagueCohortParams {
    /** The cohort whose member ranking to rebuild. */
    cohortId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** Raw row resolving the earner's current cohort id from a points event's user id. */
export interface CohortIdRow {
    /** The earner's current cohort id, or null when the user is unplaced. */
    cohort_id: string | null
}

/** CDC row from `xp_histories` (a points event moves the earner's cohort board). */
export interface LeagueCohortPointsXpHistoryCdcRow {
    /** The user who earned the points. */
    user_id?: string
}

/** One ranked member stored in the projection's jsonb `value.members`. */
export interface LeagueCohortMemberValue {
    /** Member's user id. */
    userId: string
    /** Display username (may be null). */
    username: string | null
    /** Avatar URL (may be null). */
    avatar: string | null
    /** Summed flat points within the cohort's week window. */
    weekPoints: number
}
