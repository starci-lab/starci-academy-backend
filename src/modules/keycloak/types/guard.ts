import {
    UserEntity 
} from "@modules/databases"

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
}