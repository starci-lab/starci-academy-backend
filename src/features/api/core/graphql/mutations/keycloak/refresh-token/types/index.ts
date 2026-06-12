import type {
    KeycloakExchangeCodeForTokenResponse,
} from "@modules/keycloak"

/**
 * Parameters for a coalesced refresh-token exchange.
 */
export interface ExchangeRefreshTokenParams {
    /**
     * The current (old) Keycloak refresh token presented by the client.
     */
    refreshToken: string
}

/**
 * Result of a coalesced refresh-token exchange: the fresh Keycloak token set.
 */
export type ExchangeRefreshTokenResult = KeycloakExchangeCodeForTokenResponse
