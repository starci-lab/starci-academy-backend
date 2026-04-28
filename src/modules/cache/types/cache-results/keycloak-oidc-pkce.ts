/**
 * Cached PKCE verifier and client redirect URL for Keycloak OAuth (state key in Redis).
 */
export interface KeycloakOidcPkceCacheResult {
    /** PKCE code verifier paired with the authorization challenge. */
    codeVerifier: string
    /** URL the client asked to land on after login (opaque to Keycloak OIDC redirect_uri). */
    redirectUri: string
}
