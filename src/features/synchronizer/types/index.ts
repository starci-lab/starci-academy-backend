import type {
    Locale,
} from "@modules/databases"

/**
 * One indexed payload row: entity graph after locale-specific transform.
 */
export type LocalizedElasticsearchEntity<T> = {
    /** The locale that this entity graph was transformed for. */
    locale: Locale
    /** The locale-specific entity graph ready for indexing. */
    entity: T
}
