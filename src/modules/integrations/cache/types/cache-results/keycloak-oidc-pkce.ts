import type {
    KeycloakIdentityProvider,
} from "@modules/integrations/keycloak/types/tokens"

/**
 * Cached PKCE verifier and client redirect URL for Keycloak OAuth (state key in Redis).
 */
export interface KeycloakOidcPkceCacheResult {
    /** PKCE code verifier paired with the authorization challenge. */
    codeVerifier: string
    /** URL the client asked to land on after login (opaque to Keycloak OIDC redirect_uri). */
    redirectUri: string
}

/** Cached PKCE bundle as stored: the result plus the identity provider it was issued for. */
export interface KeycloakOidcPkceCacheEntry extends KeycloakOidcPkceCacheResult {
    /** The Keycloak identity provider this bundle's flow was started for. */
    provider: KeycloakIdentityProvider
}
