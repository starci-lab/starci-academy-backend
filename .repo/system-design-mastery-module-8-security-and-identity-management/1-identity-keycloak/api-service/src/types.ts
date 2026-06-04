/**
 * Shared types for Keycloak authentication.
 */

/**
 * Response from Keycloak token endpoint (OIDC token response).
 */
export type TokenResponse = {
    access_token: string
    expires_in: number
    refresh_expires_in?: number
    refresh_token?: string
    token_type: string
    id_token?: string
    scope?: string
}

/**
 * Decoded JWT access token payload — only essential fields for the lab.
 */
export type JwtUser = {
    sub: string
    preferred_username?: string
    email?: string
}
