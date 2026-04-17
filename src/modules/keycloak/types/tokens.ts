/**
 * Request body for exchanging a code for a token.
 */
export interface KeycloakExchangeCodeForTokenParams {
    /**
     * The code parameter received from the Google OAuth2 authorization flow.
     */
    code: string

    /**
     * Identity provider used for this callback flow.
     */
    provider: KeycloakIdentityProvider
}

/** Supported identity providers for Keycloak broker callback flows. */
export enum KeycloakIdentityProvider {
    Google = "google",
    Github = "github",
}

/**
 * Response from Keycloak for exchanging a code for a token.
 */
export interface KeycloakExchangeCodeForTokenResponse {
    /**
     * The access token.
     */
    access_token: string
    /**
     * The expiration time of the access token.
     */
    expires_in: number
    /**
     * The refresh token.
     */
    refresh_token: string
    /**
     * The scope of the access token.
     */
    scope: string
    /**
     * The type of the token.
     */
    token_type: string
    /**
     * The session state of the token.
     */
    session_state: string
}

import type {
    KeycloakJwtPayload,
} from "./jwt-jwks"

export type {
    KeycloakJwtPayload,
} from "./jwt-jwks"

/**
 * Response payload from Keycloak token introspection endpoint.
 */
export interface KeycloakTokenIntrospectResponse extends Partial<KeycloakJwtPayload> {
    /**
     * Whether token is active.
     */
    active: boolean
    /**
     * Client id that issued/owns the token.
     */
    client_id?: string
    /**
     * Username associated with the token.
     */
    username?: string
    /**
     * Token type (typically "Bearer").
     */
    token_type?: string
    /**
     * Avatar of the user.
     */
    avatar?: string
}