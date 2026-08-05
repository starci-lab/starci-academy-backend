import type {
    KeycloakExchangeCodeForTokenResponse,
} from "@modules/integrations/keycloak/types/tokens"

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

/**
 * Params for {@link RefreshTokenCoalescerService.exchangeAndPublish}.
 */
export interface ExchangeAndPublishParams {
    /**
     * The current (old) Keycloak refresh token presented by the client.
     */
    refreshToken: string
    /**
     * Redis key the published result is stored under.
     */
    resultKey: string
    /**
     * Redis key of the exchange lock to release once the exchange completes.
     */
    lockKey: string
}
