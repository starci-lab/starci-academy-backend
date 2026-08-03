import {
    UserEntity 
} from "@modules/databases"
import type {
    KeycloakTokenIntrospectResponse,
} from "./tokens"

/**
 * Request with Keycloak user.
 */
export interface KeycloakAuthGuardRequest {
    /**
     * Headers of the request.
     */
    headers: Record<string, string | Array<string> | undefined>
    /**
     * User of the request.
     */
    user?: UserEntity
    /**
     * Introspection-shaped JWT claims after successful verification (realm roles, etc.).
     */
    keycloakToken?: KeycloakTokenIntrospectResponse
}