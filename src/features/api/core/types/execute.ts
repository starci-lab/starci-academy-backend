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
    /**
     * Enrollment id for the active course (user x course), injected by
     * {@link GraphQLEnrollmentGuard} from the `x-course-id` header. Present on
     * course-scoped mutations so the handler can key per-course progress by
     * enrollment -- the anchor going forward -- instead of re-resolving it.
     */
    enrollmentId?: string
    /** JWT claims from the active session (set by Keycloak auth guards). */
    keycloakToken?: KeycloakTokenIntrospectResponse
}