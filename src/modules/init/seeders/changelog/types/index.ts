import type {
    ChangelogCategory,
    LocalizedText,
} from "@modules/databases"

/**
 * One changelog row as authored in `changelog.md`. Upserted by `slug`.
 * Scalar leaves (`category` / `publishedAt` / `isPublished`) arrive from the
 * markdown extractor as strings and are coerced in the seeder.
 */
export interface ChangelogSeedItem {
    /** Stable natural key (idempotent upsert). */
    slug: string
    /** Bilingual headline. */
    title: LocalizedText
    /** Bilingual short body (markdown), optional. */
    body?: LocalizedText | null
    /** Category chip, optional. */
    category?: ChangelogCategory | null
    /** Publish date (ISO) — drives ordering + the shown date. */
    publishedAt: string
    /** Optional "read more" destination. */
    linkUrl?: string | null
    /** Whether the entry is published (defaults true). */
    isPublished?: boolean
}
