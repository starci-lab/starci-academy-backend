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
    ChangelogCategory,
} from "../enums"

// the rail lists published entries newest-first
@Index(["isPublished",
    "publishedAt"])
// stable natural key for idempotent seeding from mount data
@Unique("UQ_changelog_entry_slug",
    ["slug"])
@Entity("changelog_entries")
/**
 * A system changelog entry shown in the dashboard right rail ("Latest from our
 * changelog"). Bilingual title/body are inline jsonb; ordered by `publishedAt`
 * newest-first. Seeded from `.mount/data/changelog`.
 */
export class ChangelogEntryEntity extends UuidAbstractEntity {
    /** Stable slug from the seed file -- used to upsert idempotently. */
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

    /** Bilingual short body (markdown), or null for a title-only entry. */
    @Column({
        name: "body",
        type: "jsonb",
        nullable: true,
    })
        body: LocalizedText | null

    /** Category chip (feature / fix / announcement), or null. */
    @Column({
        name: "category",
        type: "enum",
        enum: ChangelogCategory,
        enumName: "changelog_category",
        nullable: true,
    })
        category: ChangelogCategory | null

    /** When the entry was published (drives ordering + the shown date). */
    @Column({
        name: "published_at",
        type: "timestamptz",
    })
        publishedAt: Date

    /** Optional "read more" destination. */
    @Column({
        name: "link_url",
        type: "varchar",
        length: 1024,
        nullable: true,
    })
        linkUrl: string | null

    /** Only published entries surface on the rail. */
    @Column({
        name: "is_published",
        type: "boolean",
        default: true,
    })
        isPublished: boolean
}
