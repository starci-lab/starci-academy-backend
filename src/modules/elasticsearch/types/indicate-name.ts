import type {
    Locale,
} from "@modules/databases"

/** Params for building Elasticsearch index name. */
export interface IndicateNameParams {
    /** Entity name (e.g. `CourseEntity.name`). */
    entity: string
    /** Optional locale suffix (e.g. `en`, `vi`). */
    locale?: Locale
}

