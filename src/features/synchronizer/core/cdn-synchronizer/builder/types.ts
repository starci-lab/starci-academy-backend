import type {
    Locale,
} from "@modules/databases"

/**
 * One CDN payload row: entity graph after locale-specific transform (ready to stringify / upload).
 */
export type LocalizedCdnEntity<T> = {
    locale: Locale
    entity: T
}
