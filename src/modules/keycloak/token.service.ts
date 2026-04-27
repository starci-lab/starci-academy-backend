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
    KeycloakPasswordLoginParams,
    KeycloakRegisterUserParams,
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
            redirectUri,
            codeVerifier,
        }: KeycloakExchangeCodeForTokenParams) {
        console.log({
            grant_type: "authorization_code",
            client_id: envConfig().keycloak.clientId,
            client_secret: this.mountStorageService.keycloakClientSecret,
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        })
        const response = await axios.post<KeycloakExchangeCodeForTokenResponse>(
            `${envConfig().keycloak.url}/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token`,
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

    private async requestAdminAccessToken(): Promise<string> {
        const response = await this.axiosInstance.post<{
            access_token: string
        }>(
            `/realms/${envConfig().keycloak.realm}/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: "password",
                client_id: envConfig().keycloak.admin.clientId,
                username: envConfig().keycloak.admin.username,
                password: envConfig().keycloak.admin.password,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        )

        return response.data.access_token
    }

    /**
     * Creates a Keycloak user and sets permanent password.
     */
    async registerUserWithPassword(params: KeycloakRegisterUserParams): Promise<string> {
        const adminAccessToken = await this.requestAdminAccessToken()
        
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
        const adminAccessToken = await this.requestAdminAccessToken()

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
     * Applies Brevo SMTP settings to current Keycloak realm.
     */
    async configureRealmBrevoSmtpAdapter(): Promise<void> {
        const adminAccessToken = await this.requestAdminAccessToken()

        const realmResponse = await this.axiosInstance.get<Record<string, unknown>>(
            `/admin/realms/${envConfig().keycloak.realm}`,
            {
                headers: {
                    Authorization: `Bearer ${adminAccessToken}`,
                },
            },
        )

        const secure = envConfig().services.brevo.secure
        const smtpServer = {
            host: envConfig().services.brevo.host,
            port: String(envConfig().services.brevo.port),
            from: envConfig().services.brevo.fromAddress,
            fromDisplayName: envConfig().services.brevo.fromName,
            replyTo: envConfig().services.brevo.fromAddress,
            replyToDisplayName: envConfig().services.brevo.fromName,
            auth: "true",
            user: envConfig().services.brevo.username,
            password: this.mountStorageService.brevoSmtpPassword.trim(),
            starttls: secure ? "false" : "true",
            ssl: secure ? "true" : "false",
        }

        await this.axiosInstance.put(
            `/admin/realms/${envConfig().keycloak.realm}`,
            {
                ...realmResponse.data,
                smtpServer,
            },
            {
                headers: {
                    Authorization: `Bearer ${adminAccessToken}`,
                },
            },
        )
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