import type {
    Locale,
} from "@modules/databases"

/** Params for counting documents in a per-locale index. */
export interface CountDocsParams {
    /** TypeORM entity class name (resolved to a base index via the config map). */
    entity: string
    /** Locale suffix selecting the concrete `<index>-<locale>` index. */
    locale: Locale
}

/** Params for pruning documents whose id is not in the desired set. */
export interface PruneOrphansParams {
    /** TypeORM entity class name (resolved to a base index via the config map). */
    entity: string
    /** Locale suffix selecting the concrete `<index>-<locale>` index; omit for a non-localized index. */
    locale?: Locale
    /** Doc ids that should remain -- everything else in the index is deleted. */
    ids: Array<string>
}
