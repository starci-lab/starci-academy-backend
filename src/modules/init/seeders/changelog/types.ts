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
 * Root object the markdown JSON extractor returns for the changelog seed file --
 * the authored `# N` sections are wrapped under a single `data` array.
 *
 * Declared as a `type` (not `interface`) so its implicit index signature
 * satisfies the `Record<string, unknown>` constraint of
 * `ExtractJsonFromMdService.extract<T>()` (a plain interface would not).
 */
export type ChangelogSeedFileRoot = {
    /** The changelog rows (absent when the file is empty). */
    data?: Array<ChangelogSeedItem>
}
