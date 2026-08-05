import {
    Column,
    Entity,
    Index,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    AdvertisementMediaType,
    AdvertisementPlacement,
} from "../enums"

/**
 * Inline bilingual text (no translation table -- these are small config rows).
 * Resolved to a single string by the request locale at read time.
 */
export interface LocalizedText {
    /** English text. */
    en: string
    /** Vietnamese text. */
    vi: string
}

/** `media` payload when {@link AdvertisementEntity.mediaType} is `image`. */
export interface AdvertisementImageMedia {
    /** Poster image URL. */
    url: string
}

/** `media` payload when `mediaType` is `video`. */
export interface AdvertisementVideoMedia {
    /** Video source URL (mp4 or embeddable). */
    url: string
    /** Optional poster/thumbnail shown before playback. */
    poster?: string
    /** Autoplay on mount (muted is required for autoplay to work). */
    autoplay?: boolean
    /** Loop playback. */
    loop?: boolean
    /** Start muted. */
    muted?: boolean
}

/** One slide of a carousel advertisement. */
export interface AdvertisementCarouselSlide {
    /** Slide image URL. */
    url: string
    /** Optional per-slide click destination (overrides the banner link). */
    link?: string
}

/** `media` payload when `mediaType` is `carousel`. */
export interface AdvertisementCarouselMedia {
    /** Ordered slides. */
    slides: Array<AdvertisementCarouselSlide>
    /** Auto-advance interval in ms (client default when omitted). */
    intervalMs?: number
}

/**
 * Discriminated union of the `media` jsonb keyed by {@link AdvertisementMediaType}.
 * Stored loosely as jsonb; the read layer narrows it by `mediaType`.
 */
export type AdvertisementMedia =
    | AdvertisementImageMedia
    | AdvertisementVideoMedia
    | AdvertisementCarouselMedia

// the active-ad lookup filters by placement + is_active then orders by priority
@Index(["placement",
    "isActive"])
// stable natural key for idempotent seeding from mount data
@Unique("UQ_advertisement_slug",
    ["slug"])
@Entity("advertisements")
/**
 * A dashboard advertisement banner. A paid slot carries a `sponsorName` + higher
 * `priority`; the internal "advertise here" promo is a `isHouseAd` row shown when
 * no paid ad is currently active. The banner media (image / video / carousel) is
 * stored as a discriminated jsonb `media` keyed by `mediaType`.
 */
export class AdvertisementEntity extends UuidAbstractEntity {
    /** Stable slug from the seed file -- used to upsert idempotently. */
    @Column({
        name: "slug",
        type: "varchar",
        length: 128,
    })
        slug: string

    /** UI slot this banner is shown in. */
    @Column({
        name: "placement",
        type: "enum",
        enum: AdvertisementPlacement,
        enumName: "advertisement_placement",
    })
        placement: AdvertisementPlacement

    /** Media kind -- drives how the client renders + the `media` jsonb shape. */
    @Column({
        name: "media_type",
        type: "enum",
        enum: AdvertisementMediaType,
        enumName: "advertisement_media_type",
    })
        mediaType: AdvertisementMediaType

    /** Discriminated media payload (image / video / carousel). */
    @Column({
        name: "media",
        type: "jsonb",
    })
        media: AdvertisementMedia

    /** Bilingual banner title/headline. */
    @Column({
        name: "title",
        type: "jsonb",
    })
        title: LocalizedText

    /** Bilingual call-to-action label, or null when the banner has no button. */
    @Column({
        name: "cta_text",
        type: "jsonb",
        nullable: true,
    })
        ctaText: LocalizedText | null

    /** Click destination (the whole banner links here). */
    @Column({
        name: "link_url",
        type: "varchar",
        length: 1024,
    })
        linkUrl: string

    /** Sponsor name when this is a paid slot; null for the house ad. */
    @Column({
        name: "sponsor_name",
        type: "varchar",
        length: 256,
        nullable: true,
    })
        sponsorName: string | null

    /** True for the internal "advertise here" promo (fallback when no paid ad). */
    @Column({
        name: "is_house_ad",
        type: "boolean",
        default: false,
    })
        isHouseAd: boolean

    /** Start of the display window (null = no lower bound). */
    @Column({
        name: "starts_at",
        type: "timestamptz",
        nullable: true,
    })
        startsAt: Date | null

    /** End of the display window (null = no upper bound). */
    @Column({
        name: "ends_at",
        type: "timestamptz",
        nullable: true,
    })
        endsAt: Date | null

    /** Higher wins when several ads are active (paid slots use a higher value). */
    @Column({
        name: "priority",
        type: "int",
        default: 0,
    })
        priority: number

    /** Master on/off switch. */
    @Column({
        name: "is_active",
        type: "boolean",
        default: true,
    })
        isActive: boolean
}
