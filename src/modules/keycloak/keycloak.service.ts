import {
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common"

import jwt from "jsonwebtoken"
import type {
    JwtPayload,
} from "jsonwebtoken"
import {
    createPublicKey,
} from "crypto"

import {
    URL,
} from "url"

import http from "http"
import https from "https"

import {
    MODULE_OPTIONS_TOKEN,
} from "./keycloak.module-definition"

import type {
    JwkRsaPublicKey,
    JwksResponse,
    KeycloakJwksCache,
    KeycloakJwtClaims,
    KeycloakJwtDecodedComplete,
    KeycloakModuleOptions,
    VerifiedKeycloakToken,
} from "./types"

const DEFAULT_ALGORITHMS = [
    "RS256",
]

/**
 * Service responsible for verifying Keycloak-issued access tokens (JWT) via realm JWKS.
 */
@Injectable()
export class KeycloakService {
    private readonly logger = new Logger(KeycloakService.name)

    private jwksCache?: KeycloakJwksCache

    constructor(
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options: KeycloakModuleOptions,
    ) { }

    private getIssuer(): string {
        if (this.options.issuer) return this.options.issuer
        const base = this.options.serverUrl.replace(/\/+$/, "")
        return `${base}/realms/${this.options.realm}`
    }

    private getJwksUrl(): string {
        const base = this.options.serverUrl.replace(/\/+$/, "")
        return `${base}/realms/${this.options.realm}/protocol/openid-connect/certs`
    }

    private getCacheTtlMs(): number {
        return this.options.jwksCacheTtlMs ?? 5 * 60 * 1000 // 5 minutes
    }

    private getRequestTimeoutMs(): number {
        return this.options.requestTimeoutMs ?? 5000
    }

    private async requestJson<T>(url: string): Promise<T> {
        const parsed = new URL(url)
        const timeoutMs = this.getRequestTimeoutMs()

        return await new Promise((resolve, reject) => {
            const lib = parsed.protocol === "http:" ? http : https
            const req = lib.request(
                parsed,
                {
                    method: "GET",
                    timeout: timeoutMs,
                    headers: {
                        "Accept": "application/json",
                    },
                },
                (res) => {
                    let raw = ""
                    res.setEncoding("utf8")
                    res.on("data", (chunk) => {
                        raw += chunk
                    })
                    res.on("end", () => {
                        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
                            return reject(
                                new Error(
                                    `Keycloak JWKS request failed: ${res.statusCode} ${res.statusMessage ?? ""}`.trim(),
                                ),
                            )
                        }
                        try {
                            resolve(JSON.parse(raw) as T)
                        } catch (err) {
                            reject(err)
                        }
                    })
                },
            )

            req.on("timeout", () => {
                req.destroy(new Error("Keycloak JWKS request timeout"))
            })
            req.on("error", reject)
            req.end()
        })
    }

    private async getJwksKeys(): Promise<JwkRsaPublicKey[]> {
        const now = Date.now()
        if (this.jwksCache) {
            const ageMs = now - this.jwksCache.fetchedAtMs
            if (ageMs < this.getCacheTtlMs()) return this.jwksCache.keys
        }

        const jwksUrl = this.getJwksUrl()
        const jwks = await this.requestJson<JwksResponse>(jwksUrl)

        if (!jwks?.keys?.length) {
            this.logger.error("Keycloak returned an empty JWKS payload")
            throw new UnauthorizedException("Keycloak JWKS is empty")
        }

        this.jwksCache = {
            keys: jwks.keys,
            fetchedAtMs: now,
        }
        return jwks.keys
    }

    /**
     * Verify Keycloak-issued access token (JWT) using Keycloak realm JWKS.
     */
    async verifyAccessToken(token: string): Promise<VerifiedKeycloakToken> {
        try {
            const decoded = jwt.decode(token, { complete: true }) as KeycloakJwtDecodedComplete | null

            const kid = decoded?.header?.kid
            const alg = decoded?.header?.alg

            if (!kid) {
                throw new UnauthorizedException("JWT header is missing 'kid'")
            }

            const keys = await this.getJwksKeys()
            const jwk = keys.find((k) => k.kid === kid)
            if (!jwk) {
                // Refreshing cache can help when Keycloak rotates keys.
                this.jwksCache = undefined
                const refreshedKeys = await this.getJwksKeys()
                const refreshedJwk = refreshedKeys.find((k) => k.kid === kid)
                if (!refreshedJwk) {
                    throw new UnauthorizedException("JWT signing key not found (kid mismatch)")
                }
            }

            const jwkToUse = jwk ?? keys.find((k) => k.kid === kid)

            if (!jwkToUse) {
                throw new UnauthorizedException("JWT signing key not found")
            }

            const publicKey = createPublicKey({ key: jwkToUse, format: "jwk" })
            const pem = publicKey.export({ format: "pem", type: "spki" }).toString()

            const algorithms = this.options.algorithms ?? DEFAULT_ALGORITHMS
            const payload = jwt.verify(token, pem, {
                algorithms,
                issuer: this.getIssuer(),
                audience: this.options.clientId,
            }) as JwtPayload

            return {
                header: {
                    kid,
                    alg,
                },
                claims: payload as KeycloakJwtClaims,
            }
        } catch (err) {
            this.logger.warn(`Keycloak token verification failed: ${(err as Error)?.message ?? err}`)
            if (err instanceof UnauthorizedException) throw err
            throw new UnauthorizedException("Invalid authentication token")
        }
    }
}

