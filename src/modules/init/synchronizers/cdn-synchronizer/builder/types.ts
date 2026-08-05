import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

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
    /** The display id of the entity (mount slug). Absent for entities with no slug, e.g. milestone tasks. */
    displayId?: string
    /** The id of the entity. */
    id: string
}
