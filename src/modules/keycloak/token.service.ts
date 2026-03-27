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
    KeycloakExchangeCodeForTokenParams,
    KeycloakExchangeCodeForTokenResponse,
    KeycloakTokenIntrospectResponse,
} from "./types"
import {
    MountStorageService 
} from "@modules/filesystem"

/**
 * Service responsible for verifying Keycloak-issued access tokens (JWT) via realm JWKS.
 */
@Injectable()
export class KeycloakTokenService {
    private readonly axiosInstance: AxiosInstance
    constructor(
        private readonly axiosService: AxiosService,
        private readonly mountStorageService: MountStorageService,
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
        }: KeycloakExchangeCodeForTokenParams) {
        const response = await axios.post<KeycloakExchangeCodeForTokenResponse>(
            `${envConfig().keycloak.url}/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: "authorization_code",
                client_id: envConfig().keycloak.clientId,
                client_secret: this.mountStorageService.keycloakClientSecret,
                code,
                redirect_uri: envConfig().keycloak.redirectUri,
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
     * Verifies an access token.
     * @param token - The access token.
     * @returns The payload of the token.
     */
    async verifyAccessToken(token: string): Promise<KeycloakTokenIntrospectResponse> {
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