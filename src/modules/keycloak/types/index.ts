export * from "./claims"
export * from "./jwks"
export * from "./tokens"
export * from "./request"

/**
 * Registration options for `KeycloakModule`.
 */
export interface KeycloakModuleOptions {
    /**
     * Base URL of Keycloak, e.g. `https://keycloak.example.com`.
     * Must be resolvable from the backend runtime.
     */
    serverUrl: string
    /** Keycloak realm name. */
    realm: string

    /**
     * Optional client id to use as the expected JWT `aud` claim.
     * Keycloak often sets `aud` to the client id.
     */
    clientId?: string

    /** Override JWT issuer validation (`iss`). */
    issuer?: string

    /**
     * JWKS cache TTL in ms.
     * If not provided, we keep keys for a short time to reduce fetch overhead.
     */
    jwksCacheTtlMs?: number

    /** HTTP timeout when fetching JWKS. */
    requestTimeoutMs?: number

    /**
     * Allowed JWT signing algorithms.
     * Defaults to `["RS256"]`.
     */
    algorithms?: string[]
}

