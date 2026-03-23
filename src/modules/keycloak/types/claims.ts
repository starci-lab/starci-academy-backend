/**
 * Claims object inside Keycloak access tokens (JWT).
 *
 * Keycloak may include custom realm/client/user claims, so we keep it flexible.
 */
export type KeycloakJwtClaims = Record<string, unknown>

