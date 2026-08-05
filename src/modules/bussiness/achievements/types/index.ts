import type {
    EntityManager,
} from "typeorm"
import type {
    AchievementCriteriaType,
    LocalizedText,
} from "@modules/databases"
// AchievementCriteriaType is used only by MyAchievementResult below.

/**
 * Params for recomputing one user's achievement awards.
 */
export interface RecomputeAchievementsForUserParams {
    /** The user whose definitions to (re)evaluate and award. */
    userId: string
    /**
     * Caller's transaction manager -- pass it from an inline write so the award
     * INSERTs commit atomically with the source change; omit for the CDC path.
     */
    entityManager?: EntityManager
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
    /**
     * Approximate rarity: the % of users who hold this badge (lower = rarer, shown
     * as "Top X%"). Null when the viewer hasn't earned it.
     */
    rarityPercent: number | null
}

/**
 * The achievements view returned to the profile: the full list, the earned count,
 * and the subset newly earned on this read.
 */
export interface MyAchievementsResult {
    /** Every achievement with the viewer's earned status + live progress. */
    data: Array<MyAchievementResult>
    /** How many of them the viewer has earned. */
    count: number
    /** The achievements whose first award was inserted on this read. */
    newAchievements: Array<MyAchievementResult>
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
 * Internal row shape returned by a single-column `COUNT(*)` aggregate SQL (the
 * total-users denominator for rarity).
 */
export interface AchievementCountRow {
    /** The aggregated count (Postgres returns it as text/number). */
    c: string
}

/**
 * Internal row shape returned by the per-achievement holder-count SQL (one row
 * per achievement with its distinct holder count).
 */
export interface AchievementHolderCountRow {
    /** The achievement definition's id. */
    achievement_id: string
    /** Distinct holders of that achievement (Postgres returns it as text/number). */
    c: string
}

/**
 * Internal row shape returned by the award INSERT ... RETURNING id (present only
 * when a new award row was actually created).
 */
export interface InsertedIdRow {
    /** The newly inserted `user_achievements.id`. */
    id: string
}

/** CDC row image -- every source table exposes the affected user via one of these. */
export interface AchievementSourceRow {
    /** The acting user (most tables). */
    user_id?: string
    /** The FOLLOWED user (user_follows) -- whose `followers` badge moves. */
    following_id?: string
}

export * from "./my-achievements"
