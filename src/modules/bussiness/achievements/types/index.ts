import type {
    EntityManager,
} from "typeorm"
import type {
    AchievementCriteriaType,
    LocalizedText,
} from "@modules/databases"

/**
 * Params for recomputing one user's achievement awards.
 */
export interface RecomputeAchievementsForUserParams {
    /** The user whose definitions to (re)evaluate and award. */
    userId: string
    /**
     * Caller's transaction manager — pass it from an inline write so the award
     * INSERTs commit atomically with the source change; omit for the CDC path.
     */
    entityManager?: EntityManager
}

/**
 * The current per-criteria metric values for one user, keyed by criteria type.
 * Computed once per recompute / read so each definition can be evaluated without
 * re-querying the source tables.
 */
export type AchievementCriteriaValues = Record<AchievementCriteriaType, number>

/**
 * One row of the raw per-user criteria-value query (all metrics in a single
 * round-trip). Postgres returns aggregate columns as numeric strings.
 */
export interface CriteriaValuesRow {
    /** Lessons read (`user_contents.is_read = true`). */
    lessons_read: string
    /** Current consecutive-day XP streak. */
    streak_days: string
    /** Distinct challenges passed. */
    challenges_passed: string
    /** Milestone tasks passed. */
    milestones_passed: string
    /** Courses enrolled. */
    courses_enrolled: string
}

/**
 * A single achievement as presented for the profile view: the definition fields
 * plus the viewer's earned status and live progress toward it.
 */
export interface MyAchievementResult {
    /** Stable slug (also the badge art filename stem). */
    slug: string
    /** Bilingual display name. */
    name: LocalizedText
    /** Bilingual description. */
    description: LocalizedText
    /** MinIO object key of the badge art. */
    iconKey: string
    /** Which source metric this achievement measures. */
    criteriaType: AchievementCriteriaType
    /** Single-tier bar (first tier when tiered). */
    threshold: number
    /** Whether the viewer has earned this achievement (any tier). */
    earned: boolean
    /** When it was first earned, or null when not yet earned. */
    earnedAt: Date | null
    /** The viewer's current metric value for this criteria. */
    currentValue: number
    /** Highest tier reached (1-based), or null for single-tier / not tiered. */
    tierReached: number | null
}

/**
 * One newly-earned award produced by a recompute pass (so a caller could notify
 * the user later).
 */
export interface NewlyEarnedAchievement {
    /** The achievement definition's slug. */
    slug: string
    /** The tier reached (1-based) for a tiered award; null for single-tier. */
    tier: number | null
}

/**
 * CDC row image from the topics the achievements listener follows
 * (`xp_histories` + `enrollments`). Both expose the affected user via `user_id`.
 */
export interface AchievementCdcRow {
    /** The earner (xp_histories) / enrollee (enrollments) user id. */
    user_id?: string
}
