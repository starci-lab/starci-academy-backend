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
    KeycloakPasswordLoginParams,
    KeycloakRegisterUserParams,
} from "./types"
import {
    MountStorageService 
} from "@modules/filesystem"
import {
    KeycloakJwksService 
} from "./jwks.service"
import {
    KeycloakUserService 
} from "./user.service"

/**
 * Keycloak OIDC: code exchange (client secret) and access-token verification via {@link KeycloakJwksService}.
 */
@Injectable()
export class KeycloakTokenService {
    /**
     * The Axios instance.
     */
    private readonly axiosInstance: AxiosInstance
    /**
     * The Keycloak base URL.
     */
    private readonly baseUrl = envConfig().keycloak.url.replace(/\/$/,
        "")
    /**
     * Constructor.
     * @param axiosService - The Axios service.
     * @param mountStorageService - The mount storage service.
     * @param keycloakJwksService - The Keycloak JWKS service.
     * @param keycloakUserService - The Keycloak user service.
     */
    constructor(
        private readonly axiosService: AxiosService,
        private readonly mountStorageService: MountStorageService,
        private readonly keycloakJwksService: KeycloakJwksService,
        private readonly keycloakUserService: KeycloakUserService,
    ) {
        this.axiosInstance = this.axiosService.create({
            key: "keycloak",
            config: {
                baseURL: this.baseUrl,
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
            redirectUri,
            codeVerifier,
        }: KeycloakExchangeCodeForTokenParams) {
        const response = await axios.post<KeycloakExchangeCodeForTokenResponse>(
            `${this.baseUrl}/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: "authorization_code",
                client_id: envConfig().keycloak.clientId,
                client_secret: this.mountStorageService.keycloakClientSecret,
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
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
     * Exchanges username/password (direct grant) for Keycloak tokens.
     */
    async exchangePasswordForToken(
        params: KeycloakPasswordLoginParams,
    ): Promise<KeycloakExchangeCodeForTokenResponse> {
        const response = await this.axiosInstance.post<KeycloakExchangeCodeForTokenResponse>(
            `/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: "password",
                client_id: envConfig().keycloak.clientId,
                client_secret: this.mountStorageService.keycloakClientSecret,
                username: params.username,
                password: params.password,
                scope: "openid profile email",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        )

        return response.data
    }

    /**
     * Exchanges refresh token for a new Keycloak token set.
     */
    async exchangeRefreshTokenForToken(
        params: {
            refreshToken: string
        },
    ): Promise<KeycloakExchangeCodeForTokenResponse> {
        const response = await this.axiosInstance.post<KeycloakExchangeCodeForTokenResponse>(
            `/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: "refresh_token",
                client_id: envConfig().keycloak.clientId,
                client_secret: this.mountStorageService.keycloakClientSecret,
                refresh_token: params.refreshToken,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        )
        return response.data
    }

    /**
     * Revokes a refresh token at Keycloak (OIDC token revocation endpoint).
     *
     * Note: realm must have revocation enabled; Keycloak returns 200 even if token already invalid.
     */
    async revokeRefreshToken(
        params: {
            refreshToken: string
        },
    ): Promise<void> {
        await this.axiosInstance.post(
            `/realms/${envConfig().keycloak.realm}/protocol/openid-connect/revoke`,
            new URLSearchParams({
                client_id: envConfig().keycloak.clientId,
                client_secret: this.mountStorageService.keycloakClientSecret,
                token: params.refreshToken,
                token_type_hint: "refresh_token",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        )
    }

    /**
     * Creates a Keycloak user and sets permanent password.
     */
    async registerUserWithPassword(params: KeycloakRegisterUserParams): Promise<string> {
        const adminAccessToken = await this.keycloakUserService.getAdminToken()
        
        const createResponse = await this.axiosInstance.post(
            `/admin/realms/${envConfig().keycloak.realm}/users`,
            {
                username: params.username,
                email: params.email,
                firstName: params.firstName,
                lastName: params.lastName,
                enabled: true,
                emailVerified: false,
                credentials: [
                    {
                        type: "password",
                        value: params.password,
                        temporary: false,
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${adminAccessToken}`,
                },
            },
        )

        const location = createResponse.headers?.location as string | undefined
        if (location) {
            return location.split("/").pop() ?? ""
        }

        const usersResponse = await this.axiosInstance.get<Array<{
            id: string
        }>>(
            `/admin/realms/${envConfig().keycloak.realm}/users`,
            {
                headers: {
                    Authorization: `Bearer ${adminAccessToken}`,
                },
                params: {
                    username: params.username,
                    exact: true,
                },
            },
        )

        const userId = usersResponse.data[0]?.id
        if (!userId) {
            throw new Error("Could not resolve user id after Keycloak user creation")
        }

        return userId
    }

    /**
     * Triggers Keycloak verify-email email action for a user.
     */
    async sendVerifyEmail(userId: string): Promise<void> {
        const adminAccessToken = await this.keycloakUserService.getAdminToken()

        await this.axiosInstance.put(
            `/admin/realms/${envConfig().keycloak.realm}/users/${userId}/execute-actions-email`,
            [
                "VERIFY_EMAIL",
            ],
            {
                headers: {
                    Authorization: `Bearer ${adminAccessToken}`,
                },
            },
        )
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
     * Verifies a refresh token with Keycloak token introspection.
     *
     * @param token - The refresh token (JWT).
     * @returns Introspection response (`active`, `sub` => Keycloak user id, claims).
     */
    async verifyRefreshToken(
        token: string
    ): Promise<KeycloakTokenIntrospectResponse> {
        return await this.verifyTokenIntrospect(
            token,
            "refresh_token",
        )
    }

    /**
     * Verifies an access token via Keycloak token introspection (requires client secret).
     *
     * @param token - The access token.
     * @returns Raw introspection JSON.
     */
    async verifyAccessTokenIntrospect(
        token: string
    ): Promise<KeycloakTokenIntrospectResponse> {
        return await this.verifyTokenIntrospect(
            token,
            "access_token",
        )
    }

    /**
     * Shared implementation for Keycloak token introspection.
     *
     * Note: Keycloak refresh tokens are not always locally verifiable via JWKS,
     * so introspection is used for validity checks.
     */
    private async verifyTokenIntrospect(
        token: string,
        tokenTypeHint: "access_token" | "refresh_token",
    ): Promise<KeycloakTokenIntrospectResponse> {
        const response = await this.axiosInstance.post<KeycloakTokenIntrospectResponse>(
            `${envConfig().keycloak.url}/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token/introspect`,
            new URLSearchParams({
                token,
                client_id: envConfig().keycloak.clientId,
                client_secret: this.mountStorageService.keycloakClientSecret,
                token_type_hint: tokenTypeHint,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        )
        // `sub` is the Keycloak subject, used as `keycloakUserId` in downstream cache mapping.
        return response.data
    }
}