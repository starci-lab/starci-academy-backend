import type {
    EntityManager,
} from "typeorm"

/**
 * Params for recomputing one user's contribution-calendar projection row.
 */
export interface RecomputeContributionParams {
    /** The user whose calendar to rebuild. */
    userId: string
    /** Calendar year to rebuild (e.g. 2025). */
    year: number
    /**
     * Caller's transaction manager — pass it from an inline write so the
     * projection commits atomically with the source change; omit for the read path.
     */
    entityManager?: EntityManager
}

/**
 * One active day as stored in the projection's jsonb `value.days` array.
 */
export interface ContributionDayValue {
    /** Calendar day, `YYYY-MM-DD`. */
    date: string
    /** Lessons/contents read that day. */
    contents: number
    /** Challenges passed that day. */
    challenges: number
    /** Milestone tasks passed that day. */
    milestones: number
}

/**
 * One active day in the typed calendar view returned by
 * {@link ContributionProjectionService.getCalendar} (adds the folded `total`).
 */
export interface ContributionDayResult {
    /** Calendar day, `YYYY-MM-DD`. */
    date: string
    /** Lessons/contents read that day. */
    contents: number
    /** Challenges passed that day. */
    challenges: number
    /** Milestone tasks passed that day. */
    milestones: number
    /** contents + challenges + milestones — drives the heatmap cell intensity. */
    total: number
}

/** CDC row from `activities` (the actor's contribution calendar moves). */
export interface ActivityCdcRow {
    /** The user who performed the activity. */
    user_id?: string
}
