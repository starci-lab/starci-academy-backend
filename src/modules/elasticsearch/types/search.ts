import type {
    Locale,
} from "@modules/databases"
import type {
    SearchParam,
} from "./param"

/** Params for searching Elasticsearch index by entity name. */
export interface SearchParams {
    /** The entity name. */
    entityName: string
    /** The search parameters. */
    params: SearchParam
    /** The locale. */
    locale?: Locale
}

/** Result of Elasticsearch search. */
export interface SearchResult<T> {
    data: Array<T>
    count: number
}

