import type {
    LocalizedText,
} from "@modules/databases"

/**
 * One achievement definition as authored in `achievements/achievements.md`
 * (git-sourced data root during init, else the local `.mount/data` fallback).
 * Scalar leaves (`criteriaType` / `threshold` / `tierThresholds` / `sortIndex`)
 * arrive from the markdown extractor as strings and are coerced in the seeder.
 * Upserted by `slug`.
 */
export interface AchievementSeedItem {
    /** Stable natural key (idempotent upsert) + badge art filename stem. */
    slug: string
    /** Bilingual display name. */
    name: LocalizedText
    /** Bilingual description of how it is earned. */
    description: LocalizedText
    /** Which source metric it measures (coerced to AchievementCriteriaType). */
    criteriaType?: string
    /** Single-tier bar (first tier when tiered). */
    threshold?: string
    /** Comma-separated ascending tier bars, e.g. "10,25,50"; omit for single-tier. */
    tierThresholds?: string
    /** Display order on the profile (ascending). */
    sortIndex?: string
}

/**
 * Root shape returned by the markdown extractor for `achievements.md`: the
 * `# 0`, `# 1`, ... array items are wrapped under a single `data` key. Used as the
 * generic argument to the JSON-from-markdown extractor in the seeder.
 */
export interface AchievementSeedRoot {
    /** The parsed achievement definitions, or undefined when the file is empty. */
    data?: Array<AchievementSeedItem>
}
