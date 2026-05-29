import type {
    Locale,
} from "@modules/databases"

/**
 * One CDN payload row: entity graph after locale-specific transform (ready to stringify / upload).
 */
export type LocalizedCdnEntity<T> = {
    /** Locale the entity graph was transformed for. */
    locale: Locale
    /** The localized entity graph ready to stringify / upload. */
    entity: T
}

/**
 * An entity like object with a display id and an id.
 */
export interface EntityLike {
    /** The display id of the entity. */
    displayId: string
    /** The id of the entity. */
    id: string
}
