/**
 * Public RSA JWK entry returned by the Keycloak realm JWKS endpoint.
 */
export type JwkRsaPublicKey = {
    kid?: string
    kty: "RSA" | string
    n: string
    e: string
} & Record<string, unknown>

/**
 * Response shape of the JWKS endpoint (`.../protocol/openid-connect/certs`).
 */
export interface JwksResponse {
    keys: Array<JwkRsaPublicKey>
}

/**
 * In-memory cache entry for JWKS keys.
 */
export interface KeycloakJwksCache {
    keys: Array<JwkRsaPublicKey>
    fetchedAtMs: number
}

