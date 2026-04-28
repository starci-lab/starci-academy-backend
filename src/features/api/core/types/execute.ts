import {
    Locale 
} from "@modules/databases"
import {
    UserEntity 
} from "@modules/databases"

/** Params for executing a GraphQL query. */
export interface ExecuteParams<T> {
    /** The request object. */
    request: T
    /** The locale. */
    locale?: Locale
    /** The user. */
    user?: UserEntity
}