import {
    createHash,
    randomBytes,
} from "crypto"
import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    KeycloakIdentityProvider,
} from "./types/tokens"
import {
    OidcStateExpiredException,
} from "@modules/platform/exceptions/errors/keycloak/oidc-state-expired"
import type {
    KeycloakOidcPkceCacheResult,
} from "@modules/integrations/cache/types/cache-results/keycloak-oidc-pkce"
import {
    OAuthStateService,
} from "@modules/platform/oauth-state/oauth-state.service"
import {
    OAuthStatePurpose,
} from "@modules/platform/oauth-state/types"
@Injectable()
/**
 * Starts Keycloak broker OAuth from the backend: caches PKCE + client redirect URI, returns authorization URL.
 */
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
        private readonly oauthStateService: OAuthStateService,
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
 * Random PKCE code_verifier (43-128 chars, URL-safe).
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
        const codeVerifier = this.generateCodeVerifier()
        const codeChallenge = this.createCodeChallengeS256(
            codeVerifier
        )
        const state = await this.oauthStateService.issue({
            purpose: OAuthStatePurpose.KeycloakBroker,
            payload: {
                provider,
                codeVerifier,
                redirectUri,
            },
        })
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
     * Atomically consumes PKCE + redirect URI written during the redirect.
     */
    async consumePkceBundle(
        provider: KeycloakIdentityProvider,
        state: string,
    ): Promise<KeycloakOidcPkceCacheResult> {
        const cached = await this.oauthStateService.consume<
            KeycloakOidcPkceCacheResult & { provider: KeycloakIdentityProvider }
        >({
            purpose: OAuthStatePurpose.KeycloakBroker,
            state,
        })
        if (!cached || cached.provider !== provider) {
            throw new OidcStateExpiredException({
            })
        }
        return {
            codeVerifier: cached.codeVerifier,
            redirectUri: cached.redirectUri,
        }
    }
}
