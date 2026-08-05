import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/** Params for building Elasticsearch index name. */
export interface IndicateNameParams {
    /** Entity name (e.g. `CourseEntity.name`). */
    entity: string
    /** Optional locale suffix (e.g. `en`, `vi`). */
    locale?: Locale
}

