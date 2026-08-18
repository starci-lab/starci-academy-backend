import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
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

/**
 * GraphQL execution context shape exposing the Keycloak-augmented request
 * (Apollo's NestJS driver places it on `req`; absent for transports that
 * carry no request, e.g. subscriptions).
 */
export interface KeycloakGraphQLContext {
    req?: KeycloakAuthGuardRequest
}