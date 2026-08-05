import type {
    LocalizedText,
} from "@modules/databases/postgresql/primary/entities/advertisement.entity"
import type {
    ChangelogCategory,
} from "@modules/databases/postgresql/primary/enums/changelog-category"

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
    /** Publish date (ISO) -- drives ordering + the shown date. */
    publishedAt: string
    /** Optional "read more" destination. */
    linkUrl?: string | null
    /** Whether the entry is published (defaults true). */
    isPublished?: boolean
}

/**
 * Root shape returned by the markdown extractor for `changelog.md`. The mount
 * grammar's top-level `# <n>` array items are wrapped under a `data` key, so the
 * extractor's generic argument is this object -- not the bare array.
 */
export interface ChangelogSeedRoot {
    /** The parsed changelog entries; absent when the file has no array items. */
    data?: Array<ChangelogSeedItem>
}
