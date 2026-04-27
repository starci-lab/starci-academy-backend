import type {
    KeycloakJwtPayload,
} from "./jwt-jwks"
import {
    createEnumType 
} from "@modules/common"
/**
 * Request body for exchanging username/password for a token.
 */
export interface KeycloakPasswordLoginParams {
    username: string
    password: string
}

/**
 * Parameters for creating a Keycloak user with password credentials.
 */
export interface KeycloakRegisterUserParams {
    username: string
    email: string
    password: string
    firstName?: string
    lastName?: string
}
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

    /**
     * Override redirect URI (must match the one used to obtain the code).
     * When omitted, it is resolved from envConfig() by provider.
     */
    redirectUri: string

    /**
     * Code verifier used for the code exchange.
     */
    codeVerifier: string
}

/** Supported identity providers for Keycloak broker callback flows. */
import {
    registerEnumType,
} from "@nestjs/graphql"

/** Supported identity providers for Keycloak broker callback flows. */
export enum KeycloakIdentityProvider {
    Google = "google",
    Github = "github",
}

export const GraphQLKeycloakIdentityProvider = createEnumType(KeycloakIdentityProvider)

registerEnumType(
    GraphQLKeycloakIdentityProvider,
    {
        name: "KeycloakIdentityProvider",
        description: "Supported identity providers for Keycloak broker callback flows.",
        valuesMap: {
            [KeycloakIdentityProvider.Google]: {
                description: "Google identity provider.",
            },
            [KeycloakIdentityProvider.Github]: {
                description: "Github identity provider.",
            },
        },
    },
)

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
    /**
     * Optional ID token (present when openid scope is included).
     */
    id_token?: string
}

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