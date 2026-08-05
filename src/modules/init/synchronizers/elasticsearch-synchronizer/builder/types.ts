import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/**
 * One indexed payload row: entity graph after locale-specific transform.
 */
export type LocalizedElasticsearchEntity<T> = {
    /** Locale the entity graph was transformed for. */
    locale: Locale
    /**
     * Localized entity graph plus optional ES-only completion payload (`suggest`).
     * Index-only fields are not on the TypeORM entity.
     */
    entity: T & {
        suggest?: unknown
    }
}
