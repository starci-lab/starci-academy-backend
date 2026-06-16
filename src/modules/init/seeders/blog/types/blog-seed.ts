/**
 * The fields parsed from a single blog post language file
 * (`blog/<index>-<slug>/{en,vi}.md`). Every leaf arrives from the markdown
 * extractor as a trimmed string; the seeder coerces the scalar metadata and
 * pairs the per-language leaves (`title` / `excerpt` / `body` / `ctaLabel`) into
 * bilingual jsonb objects.
 *
 * Declared as a `type` (not `interface`) so its implicit index signature
 * satisfies the `Record<string, unknown>` constraint of
 * `ExtractJsonFromMdService.extract<T>()` (a plain interface would not).
 */
export type BlogPostLangFields = {
    /** Per-language headline. */
    title?: string
    /** Per-language short summary for list cards / meta description. */
    excerpt?: string
    /** Per-language full body (markdown). */
    body?: string
    /** Editorial pillar slug (language-agnostic; read from the primary file). */
    category?: string
    /** Cover image URL (language-agnostic). */
    coverImageUrl?: string
    /** Estimated reading time in minutes (language-agnostic). */
    readingMinutes?: string
    /** Funnel CTA destination (language-agnostic). */
    ctaUrl?: string
    /** Per-language CTA button label. */
    ctaLabel?: string
    /** "View on GitHub" source link (language-agnostic). */
    sourceUrl?: string
    /** Whether the body is members-only (language-agnostic; defaults false). */
    isPremium?: string
    /** Whether the post is published (language-agnostic; defaults true). */
    isPublished?: string
    /** Publish date (ISO; language-agnostic) — drives ordering + shown date. */
    publishedAt?: string
}
