/**
 * OpenID Connect token response from Keycloak.
 */
export interface TokenResponse {
    access_token: string
    expires_in: number
    refresh_expires_in?: number
    refresh_token?: string
    token_type: string
    id_token?: string
    scope?: string
    session_state?: string
}

/**
 * Keycloak error JSON payload when token request fails.
 */
export interface KeycloakErrorPayload {
    error?: string
    error_description?: string
}
