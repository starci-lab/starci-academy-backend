import {
    decode,
    TokenExpiredError,
} from "jsonwebtoken"
import {
    TypedSocket 
} from "../types"
import { 
    SocketIoAccessTokenMissingException,
    SocketIoAccessTokenInvalidException,
    SocketIoAccessTokenExpiredException
} from "@modules/exceptions"
import {
    KeycloakTokenService,
} from "@modules/keycloak"

/**
 * Rejects the handshake unless a live Keycloak access token is present -- otherwise
 * `socket.data.userId` would be unset for room joins.
 */
export const socketIoKeycloakAuthMiddleware = (
    socket: TypedSocket,
    next: (err?: Error) => void,
) => {
    let token: string | undefined
    try {
        token = socket.handshake.auth?.token || socket.handshake.query?.token
        if (!token) {
            return next(new SocketIoAccessTokenMissingException({
            }))
        }
        const tokenValue = token

        // resolve KeycloakTokenService from the app (same pattern as DerivedJwtSecretService)
        const keycloakTokenService = globalThis.__APP__.get(
            KeycloakTokenService,
            {
                strict: false,
            },
        )

        // verify JWT using Keycloak realm JWKS
        void keycloakTokenService.verifyAccessToken(tokenValue)
            .then((introspect) => {
                if (!introspect?.active) {
                    // best-effort: distinguish expired vs invalid by `exp` claim
                    const decoded = decode(tokenValue) as { exp?: number } | null
                    const expired = !!decoded?.exp && decoded.exp * 1000 < Date.now()
                    if (expired) {
                        return next(new SocketIoAccessTokenExpiredException({
                            token: tokenValue,
                            originalError: new TokenExpiredError(
                                "jwt expired",
                                new Date(decoded!.exp! * 1000),
                            ),
                        }))
                    }
                    return next(new SocketIoAccessTokenInvalidException({
                        originalError: new Error("Keycloak token inactive"),
                    }))
                }

                // map user id for downstream room-join logic (JobPipelineGateway, etc.)
                socket.data.userId = introspect.sub ?? ""
                return next()
            })
            .catch((err) => {
                return next(new SocketIoAccessTokenInvalidException({
                    originalError: err,
                }))
            })
    } catch (err) {
        return next(new SocketIoAccessTokenInvalidException({
            originalError: err as Error,
        }))
    }
}