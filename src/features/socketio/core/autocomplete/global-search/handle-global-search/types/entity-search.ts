import {
    Locale 
} from "@modules/databases"

/** Params for executing an entity search. */
export interface EntitySearchParams {
    /** The search term. */
    term: string
    /** The number of results to return. */
    size: number
    /** The locale. */
    locale: Locale
}