import {
    Column,
    Entity,
    Index,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import type {
    LocalizedText,
} from "./advertisement.entity"
import {
    BlogCategory,
} from "../enums"

/**
 * A blog post authored by the team and seeded from `.mount/data/blog/blog.md`
 * (mount markdown grammar). Bilingual `title` / `excerpt` / `body` / `ctaLabel`
 * are inline jsonb (no translation table — these are editorial content rows
 * resolved to the request locale at read time). Ordered by `publishedAt`
 * newest-first. Idempotent on `slug`.
 *
 * Pure persistence entity: GraphQL exposes only locale-resolved projections via
 * the blog query response types, so this carries no `@Field` decorators.
 */
// the listing reads published posts newest-first, optionally filtered by category
@Index(["isPublished",
    "publishedAt"])
// stable natural key for idempotent seeding from mount data
@Unique("UQ_blog_post_slug",
    ["slug"])
@Entity("blog_posts")
export class BlogPostEntity extends UuidAbstractEntity {
    /** Stable slug from the seed file — used to upsert idempotently and as the FE `/blog/[slug]` route key. */
    @Column({
        name: "slug",
        type: "varchar",
        length: 128,
    })
        slug: string

    /** Bilingual headline. */
    @Column({
        name: "title",
        type: "jsonb",
    })
        title: LocalizedText

    /** Bilingual short summary shown on list cards / meta description, or null. */
    @Column({
        name: "excerpt",
        type: "jsonb",
        nullable: true,
    })
        excerpt: LocalizedText | null

    /** Bilingual full body (markdown). */
    @Column({
        name: "body",
        type: "jsonb",
    })
        body: LocalizedText

    /** Editorial pillar chip (deep-dive / build-in-public / career / ai / case-study). */
    @Column({
        name: "category",
        type: "enum",
        enum: BlogCategory,
        enumName: "blog_category",
        default: BlogCategory.DeepDive,
    })
        category: BlogCategory

    /** Optional cover image URL shown on the card + article header. */
    @Column({
        name: "cover_image_url",
        type: "varchar",
        length: 1024,
        nullable: true,
    })
        coverImageUrl: string | null

    /** Optional estimated reading time in minutes (shown on the card). */
    @Column({
        name: "reading_minutes",
        type: "int",
        nullable: true,
    })
        readingMinutes: number | null

    /**
     * Optional funnel CTA destination shown at the foot of the article
     * (e.g. the related course page) — pairs with {@link BlogPostEntity.ctaLabel}.
     */
    @Column({
        name: "cta_url",
        type: "varchar",
        length: 1024,
        nullable: true,
    })
        ctaUrl: string | null

    /** Bilingual CTA button label (only meaningful when `ctaUrl` is set), or null. */
    @Column({
        name: "cta_label",
        type: "jsonb",
        nullable: true,
    })
        ctaLabel: LocalizedText | null

    /**
     * Optional "View on GitHub" source link for codebase-analysis posts — the
     * repo/file/module URL the article dissects. Left null while the repo is
     * private; populated once the project is open-sourced.
     */
    @Column({
        name: "source_url",
        type: "varchar",
        length: 1024,
        nullable: true,
    })
        sourceUrl: string | null

    /**
     * When true the full body is members-only (community membership). Reserved
     * for the build-in-public pillar; deep-dive posts stay public for SEO.
     */
    @Column({
        name: "is_premium",
        type: "boolean",
        default: false,
    })
        isPremium: boolean

    /** When the post was published — drives ordering + the shown date. */
    @Column({
        name: "published_at",
        type: "timestamptz",
    })
        publishedAt: Date

    /** Only published posts surface in the public queries. */
    @Column({
        name: "is_published",
        type: "boolean",
        default: true,
    })
        isPublished: boolean
}
