import {
    Injectable 
} from "@nestjs/common"
import {
    AxiosService 
} from "@modules/axios"
import axios, {
    AxiosInstance 
} from "axios"
import {
    envConfig 
} from "@modules/env"
import {
    KeycloakIdentityProvider,
    KeycloakExchangeCodeForTokenParams,
    KeycloakExchangeCodeForTokenResponse,
    KeycloakTokenIntrospectResponse,
} from "./types"
import {
    MountStorageService 
} from "@modules/filesystem"
import {
    KeycloakJwksService 
} from "./jwks.service"

/**
 * Keycloak OIDC: code exchange (client secret) and access-token verification via {@link KeycloakJwksService}.
 */
@Injectable()
export class KeycloakTokenService {
    private readonly axiosInstance: AxiosInstance
    constructor(
        private readonly axiosService: AxiosService,
        private readonly mountStorageService: MountStorageService,
        private readonly keycloakJwksService: KeycloakJwksService,
    ) {
        this.axiosInstance = this.axiosService.create({
            key: "keycloak",
            config: {
                baseURL: envConfig().keycloak.url,
            },
        })
    }

    /**
     * Exchanges a code for a token.
     * @param params - The parameters for the request.
     * @returns The token response.
     */
    async exchangeCodeForToken(
        { 
            code,
            provider,
        }: KeycloakExchangeCodeForTokenParams) {
        const redirectUri = this.resolveRedirectUri(provider)
        const response = await axios.post<KeycloakExchangeCodeForTokenResponse>(
            `${envConfig().keycloak.url}/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: "authorization_code",
                client_id: envConfig().keycloak.clientId,
                client_secret: this.mountStorageService.keycloakClientSecret,
                code,
                redirect_uri: redirectUri,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        )
        return response.data
    }

    /**
     * Resolve redirect URI by provider.
     * @param provider - The provider handling the callback.
     * @returns Redirect URI configured for provider.
     */
    private resolveRedirectUri(provider: KeycloakIdentityProvider): string {
        switch (provider) {
        case KeycloakIdentityProvider.Google:
            return envConfig().keycloak.redirectUri.google
        case KeycloakIdentityProvider.Github:
            return envConfig().keycloak.redirectUri.github
        default:
            return envConfig().keycloak.redirectUri.google
        }
    }

    /**
     * Verifies an access token with realm JWKS (no introspection round-trip).
     *
     * @param token - The access token (JWT).
     * @returns Introspection-compatible shape (`active`, `sub`, claims).
     */
    async verifyAccessToken(token: string): Promise<KeycloakTokenIntrospectResponse> {
        return this.keycloakJwksService.verifyAccessToken(token)
    }

    /**
     * Verifies an access token via Keycloak token introspection (requires client secret).
     *
     * @param token - The access token.
     * @returns Raw introspection JSON.
     */
    async verifyAccessTokenIntrospect(token: string): Promise<KeycloakTokenIntrospectResponse> {
        const response = await this.axiosInstance.post<KeycloakTokenIntrospectResponse>(
            `${envConfig().keycloak.url}/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token/introspect`,
            new URLSearchParams({
                token,
                client_id: envConfig().keycloak.clientId,
                client_secret: this.mountStorageService.keycloakClientSecret,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        )
        return response.data
    }
}