import {
    createHash,
    randomBytes,
    randomUUID,
} from "crypto"
import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    KeycloakIdentityProvider,
} from "./types"
import {
    OidcStateExpiredException,
} from "@modules/exceptions"
import type {
    KeycloakOidcPkceCacheResult,
} from "@modules/cache"
/**
 * Starts Keycloak broker OAuth from the backend: caches PKCE + client redirect URI, returns authorization URL.
 */
@Injectable()
export class KeycloakOidcRedirectService {
    /**
     * The Keycloak base URL.
     */
    private readonly baseUrl = envConfig().keycloak.url.replace(/\/$/,
        "")
    /**
     * Constructor.
     * @param cacheService - The cache service.
     */
    constructor(
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Converts a buffer to a base64 URL.
     */
    toBase64Url (buf: Buffer): string {
        return buf
            .toString("base64")
            .replace(
                /\+/g,
                "-"
            )
            .replace(
                /\//g,
                "_"
            )
            .replace(
                /=+$/u,
                ""
            )
    }

    /**
 * Random PKCE code_verifier (43–128 chars, URL-safe).
 */
    generateCodeVerifier(): string {
        return this.toBase64Url(
            randomBytes(32)
        )
    }

    /**
    * S256 code_challenge for a given code_verifier.
    */
    createCodeChallengeS256(codeVerifier: string): string {
        return this.toBase64Url(
            createHash("sha256")
                .update(
                    codeVerifier
                )
                .digest()
        )
    }

    /**
     * Stores PKCE verifier and redirect URI, returns Keycloak authorize URL (302 target).
     */
    async buildAuthorizeRedirectUrl(
        provider: KeycloakIdentityProvider,
        redirectUri: string,
    ): Promise<string> {
        const state = randomUUID()
        const codeVerifier = this.generateCodeVerifier()
        const codeChallenge = this.createCodeChallengeS256(
            codeVerifier
        )
        await this.cacheService.set(
            {
                key: CacheKey.KeycloakOidcPkce,
                args: [
                    provider,
                    state,
                ],
                cacheResult: {
                    codeVerifier,
                    redirectUri,
                },
            }
        )
        const {
            realm,
            clientId,
        } = envConfig().keycloak
        const authUrl = new URL(
            `${this.baseUrl}/realms/${realm}/protocol/openid-connect/auth`
        )
        const params: Record<string, string> = {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "openid email profile",
            state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
            kc_idp_hint: provider,
        }
        Object.entries(params).forEach(
            (
                [
                    key,
                    val,
                ]
            ) => authUrl.searchParams.set(
                key,
                val
            )
        )
        return authUrl.toString()
    }

    /**
     * Loads PKCE + redirect URI written during {@link buildAuthorizeRedirectUrl} (does not delete).
     */
    async loadPkceBundle(
        provider: KeycloakIdentityProvider,
        state: string,
    ): Promise<KeycloakOidcPkceCacheResult> {
        const cached = await this.cacheService.get({
            key: CacheKey.KeycloakOidcPkce,
            args: [
                provider,
                state,
            ],
        })
        if (!cached) {
            throw new OidcStateExpiredException({
            })
        }
        return cached
    }

    /**
     * Clears PKCE cache after a successful token exchange.
     */
    async clearPkceBundle(
        provider: KeycloakIdentityProvider,
        state: string,
    ): Promise<void> {
        await this.cacheService.del({
            key: CacheKey.KeycloakOidcPkce,
            args: [
                provider,
                state,
            ],
        })
    }
}
