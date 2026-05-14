import {
    Locale 
} from "@modules/databases"
import {
    UserEntity 
} from "@modules/databases"
import type {
    KeycloakTokenIntrospectResponse,
} from "@modules/keycloak"

/** Params for executing a GraphQL query. */
export interface ExecuteParams<T> {
    /** The request object. */
    request: T
    /** The locale. */
    locale?: Locale
    /** The user. */
    user?: UserEntity
    /** JWT claims from the active session (set by Keycloak auth guards). */
    keycloakToken?: KeycloakTokenIntrospectResponse
}