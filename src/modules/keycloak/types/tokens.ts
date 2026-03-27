/**
 * Request body for exchanging a code for a token.
 */
export interface KeycloakExchangeCodeForTokenParams {
    /**
     * The code parameter received from the Google OAuth2 authorization flow.
     */
    code: string
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

/**
 * Payload of the JWT token.
 */
export interface KeycloakJwtPayload {
    /**
     * The expiration time of the token.
     */
    exp: number
    /**
     * The issuance time of the token.
     */
    iat: number
    /**
     * The authentication time of the token.
     */
    auth_time: number
    /**
     * The JWT ID of the token.
     */
    jti: string
    /**
     * The issuer of the token.
     */
    iss: string
    /**
     * The audience of the token.
     */
    aud: string | Array<string>
    /**
     * The subject of the token.
     */
    sub: string
    /**
     * The type of the token.
     */
    typ: string
    /**
     * The authorized party of the token.
     */
    azp: string
    /**
     * The session ID of the token.
     */
    sid: string
    /**
     * The authentication context class of the token.
     */
    acr: string
    /**
     * The scope of the token.
     */
    scope: string
    /**
     * Whether the email is verified.
     */
    email_verified: boolean
    /**
     * The name of the user.
     */
    name: string
    /**
     * The preferred username of the user.
     */
    preferred_username: string
    /**
     * The given name of the user.
     */
    given_name: string
    /**
     * The family name of the user.
     */
    family_name: string
    /**
     * The email of the user.
     */
    email: string
    /**
     * The realm access of the token.
     */
    realm_access?: {
      roles: Array<string>
    }
    /**
     * The resource access of the token.
     */
    resource_access?: {
      [client: string]: {
        /**
         * The roles of the client.
         */
        roles: Array<string>
      }
    }
}

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
}