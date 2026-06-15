import type {
    AchievementCriteriaType,
    LocalizedText,
} from "@modules/databases"

/**
 * One starter achievement definition as authored in the in-code catalog.
 * Upserted by `slug` on boot. `iconKey` is derived from the slug at seed time
 * when omitted.
 */
export interface AchievementSeedItem {
    /** Stable natural key (idempotent upsert) + badge art filename stem. */
    slug: string
    /** Bilingual display name. */
    name: LocalizedText
    /** Bilingual description of how it is earned. */
    description: LocalizedText
    /** Which source metric the achievement is measured against. */
    criteriaType: AchievementCriteriaType
    /** Single-tier bar (first tier when tiered). */
    threshold: number
    /** Ascending tier bars for a tiered badge; omit/null for single-tier. */
    tierThresholds?: Array<number> | null
    /** Display order on the profile (ascending). */
    sortIndex: number
}
