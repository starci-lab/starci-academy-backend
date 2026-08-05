import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/**
 * One indexed payload row: entity graph after locale-specific transform.
 */
export type LocalizedElasticsearchEntity<T> = {
    /** Locale the entity graph was transformed for. */
    locale: Locale
    /** The localized entity graph ready to index. */
    entity: T
}
