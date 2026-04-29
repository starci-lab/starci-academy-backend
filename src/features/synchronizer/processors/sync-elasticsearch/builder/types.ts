import type {
    Locale,
} from "@modules/databases"

/**
 * One indexed payload row: entity graph after locale-specific transform.
 */
export type LocalizedElasticsearchEntity<T> = {
    locale: Locale
    entity: T
}
