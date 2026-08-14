import {
    Injectable,
} from "@nestjs/common"
import {
    KeycloakJwtHeaderKidNotFoundException,
} from "@modules/platform/exceptions/errors/keycloak/header-kid-not-found"
import {
    KeycloakJwtInvalidPayloadException,
} from "@modules/platform/exceptions/errors/keycloak/invalid-jwt-payload"
import {
    KeycloakJwksSigningKeyNotFoundException,
} from "@modules/platform/exceptions/errors/keycloak/jwks-signing-key-not-found"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    KeycloakJwtPayload,
} from "./types/jwt-jwks"
import {
    KeycloakTokenIntrospectResponse,
} from "./types/tokens"
import {
    GetPublicKeyOrSecret, 
    JwtPayload,
    verify,
} from "jsonwebtoken"
import jwksRsa from "jwks-rsa"

@Injectable()
/**
 * Verifies Keycloak access tokens locally using the realm JWKS (`/protocol/openid-connect/certs`).
 */
export class KeycloakJwksService {
    private readonly jwksClient: ReturnType<typeof jwksRsa>

    constructor() {
        const baseUrl = envConfig().keycloak.url.replace(/\/$/,
            "")
        const jwksUri = `${baseUrl}/realms/${envConfig().keycloak.realm}/protocol/openid-connect/certs`
        this.jwksClient = jwksRsa(
            {
                jwksUri,
                cache: true,
                cacheMaxAge: 600_000,
                rateLimit: true,
            }
        )
    }

    /**
     * Resolves the signing key for `jwt.verify` from JWKS (`kid` header).
     */
    private readonly getSigningKey: GetPublicKeyOrSecret = (
        header,
        callback,
    ) => {
        if (!header.kid) {
            callback(
                new KeycloakJwtHeaderKidNotFoundException({
                    alg: header.alg,
                    typ: header.typ,
                }),
            )
            return
        }
        this.jwksClient.getSigningKey(
            header.kid,
            (err, key) => {
                if (err) {
                    callback(err)
                    return
                }
                if (!key) {
                    callback(
                        new KeycloakJwksSigningKeyNotFoundException({
                        }),
                    )
                    return
                }
                callback(
                    null,
                    key.getPublicKey(),
                )
            },
        )
    }

    /**
     * Validates RS256 signature, issuer, and expiry; maps claims to introspection-shaped result.
     *
     * @param token - Raw Bearer access token (JWT).
     * @returns Same shape as token introspection for guards and services.
     */
    async verifyAccessToken(token: string): Promise<KeycloakTokenIntrospectResponse> {
        const baseUrl = envConfig().keycloak.url.replace(/\/$/,
            "")
        const issuer = `${baseUrl}/realms/${envConfig().keycloak.realm}`
        try {
            const decoded = await new Promise<JwtPayload>(
                (resolve,
                    reject) => {
                    verify(
                        token,
                        this.getSigningKey,
                        {
                            algorithms: [
                                "RS256",
                            ],
                            issuer,
                            clockTolerance: 30,
                        },
                        (err,
                            payload) => {
                            if (err) {
                                reject(err)
                                return
                            }
                            if (!payload || typeof payload === "string") {
                                reject(
                                    new KeycloakJwtInvalidPayloadException({
                                        payload,
                                    }),
                                )
                                return
                            }
                            resolve(payload)
                        },
                    )
                })
            const claims = decoded as KeycloakJwtPayload
            if (!claims.sub) {
                return {
                    active: false,
                }
            }
            return {
                ...claims,
                active: true,
                sub: claims.sub,
                preferred_username: claims.preferred_username,
                username: claims.preferred_username,
                email: claims.email,
            }
        } catch {
            return {
                active: false,
            }
        }
    }
}