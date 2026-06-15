import type {
    AdvertisementMedia,
    AdvertisementMediaType,
    AdvertisementPlacement,
    LocalizedText,
} from "@modules/databases"

/**
 * One advertisement row as authored in `advertisements.yaml`. Upserted by `slug`.
 */
export interface AdvertisementSeedItem {
    /** Stable natural key (idempotent upsert). */
    slug: string
    /** UI slot. */
    placement: AdvertisementPlacement
    /** Media kind (drives the `media` shape). */
    mediaType: AdvertisementMediaType
    /** Discriminated media payload. */
    media: AdvertisementMedia
    /** Bilingual title. */
    title: LocalizedText
    /** Bilingual CTA label (optional). */
    ctaText?: LocalizedText | null
    /** Click destination. */
    linkUrl: string
    /** Sponsor name (paid slot) or null/absent for the house ad. */
    sponsorName?: string | null
    /** House-ad flag (fallback when no paid ad). */
    isHouseAd?: boolean
    /** Display-window start (ISO) or null. */
    startsAt?: string | null
    /** Display-window end (ISO) or null. */
    endsAt?: string | null
    /** Ordering weight (paid slots higher). */
    priority?: number
    /** Master on/off. */
    isActive?: boolean
}
