import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/** Params for deleting a single document from a (per-locale) Elasticsearch index. */
export interface DeleteEntityParams {
    /** TypeORM entity class name (resolved to a base index via the config map). */
    entity: string
    /** Document `_id` to delete (the source row's primary-key id). */
    id: string
    /** Optional locale suffix selecting the concrete `<index>-<locale>` index; omit for a non-localized index. */
    locale?: Locale
}
