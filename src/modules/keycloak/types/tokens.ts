import type {
    JwtPayload,
} from "jsonwebtoken"

import type {
    KeycloakJwtClaims,
} from "./claims"

/**
 * JWT header information extracted from the access token.
 */
export interface KeycloakJwtHeader {
    kid?: string
    alg?: string
}

/**
 * Result of `jsonwebtoken.decode(token, { complete: true })`.
 * We only care about the `header` part.
 */
export interface KeycloakJwtDecodedComplete {
    header?: KeycloakJwtHeader
}

/**
 * Verified token returned by `KeycloakService.verifyAccessToken()`.
 */
export interface VerifiedKeycloakToken {
    claims: KeycloakJwtClaims
    header: KeycloakJwtHeader
}

/**
 * Convenience alias for JWT payload type used during verification.
 */
export type KeycloakJwtPayload = JwtPayload

