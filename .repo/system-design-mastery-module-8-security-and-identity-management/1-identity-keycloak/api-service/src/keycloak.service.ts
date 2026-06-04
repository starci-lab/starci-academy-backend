/**
 * Service lesson — methods documented Logic + Code (§4).
 * (EN: Lesson service — Logic + Code on methods (§4).)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    Logger,
} from "@nestjs/common"

/**
 * Core lesson service logic.
 */
@Injectable()
export class KeycloakService {
    private readonly logger = new Logger(KeycloakService.name)

/**
 * Logic — Read/query via `getAuthorizeUrl`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getAuthorizeUrl(): string {
        const state = Math.random().toString(36).slice(2)
        const params = new URLSearchParams({
            client_id: this.publicClientId,
            response_type: "code",
            scope: "openid profile email",
            redirect_uri: this.redirectUri,
            state,
        })
        return `${this.authorizeEndpoint}?${params.toString()}`
    }

    /**
 * Logic — Business handler `loginPublicClient` for the lab.
 * Code — `async loginPublicClient()` — uses injected deps / clients.
 */
    async loginPublicClient(username?: string, password?: string): Promise<TokenResponse> {
        const effectiveUsername = username ?? this.defaultUsername
        const effectivePassword = password ?? this.defaultPassword
        if (!effectiveUsername || !effectivePassword) {
            throw new BadRequestException("username and password are required")
        }
        const form = new URLSearchParams()
        form.set("client_id", this.publicClientId)
        form.set("grant_type", "password")
        form.set("username", effectiveUsername)
        form.set("password", effectivePassword)
        this.logger.log(`[public-client] Password grant for user=${effectiveUsername}`)
        return this.fetchToken(form)
    }

    /**
 * Logic — Business handler `loginPrivateClient` for the lab.
 * Code — `async loginPrivateClient()` — uses injected deps / clients.
 */
    async loginPrivateClient(username?: string, password?: string): Promise<TokenResponse> {
        const effectiveUsername = username ?? this.defaultUsername
        const effectivePassword = password ?? this.defaultPassword
        if (!effectiveUsername || !effectivePassword) {
            throw new BadRequestException("username and password are required")
        }
        const form = new URLSearchParams()
        form.set("client_id", this.privateClientId)
        form.set("client_secret", this.privateClientSecret)
        form.set("grant_type", "password")
        form.set("username", effectiveUsername)
        form.set("password", effectivePassword)
        this.logger.log(`[private-client] Password grant for user=${effectiveUsername}`)
        return this.fetchToken(form)
    }

    /**
 * Logic — Business handler `exchangeCode` for the lab.
 * Code — `async exchangeCode()` — uses injected deps / clients.
 */
    async exchangeCode(code: string): Promise<TokenResponse> {
        if (!code) {
            throw new BadRequestException("Missing `code` query param.")
        }
        const form = new URLSearchParams()
        form.set("client_id", this.publicClientId)
        form.set("grant_type", "authorization_code")
        form.set("code", code)
        form.set("redirect_uri", this.redirectUri)
        this.logger.log("[public-client] Exchange authorization_code with Keycloak")
        return this.fetchToken(form)
    }

    /**
 * Logic — Business handler `fetchToken` for the lab.
 * Code — `async fetchToken()` — uses injected deps / clients.
 */
    private async fetchToken(form: URLSearchParams): Promise<TokenResponse> {
        const response = await fetch(this.tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: form.toString(),
        })
        const payload = (await response.json()) as TokenResponse | KeycloakErrorPayload
        if (!response.ok) {
            throw new BadRequestException(
                `Keycloak token request failed: ${response.status} ${JSON.stringify(payload)}`,
            )
        }
        return payload as TokenResponse
    }
}
