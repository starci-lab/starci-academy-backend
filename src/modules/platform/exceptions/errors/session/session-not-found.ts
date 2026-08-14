import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a missing/already-revoked login session lookup. */
export interface LoginSessionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The Keycloak subject (user id) the lookup was scoped to. */
    keycloakId?: string
    /** The session id that could not be found among the user's active sessions. */
    sessionId?: string
}

/**
 * Thrown when a user tries to revoke a login session id that does not exist (or
 * is already revoked) among their own active sessions.
 */
export class LoginSessionNotFoundException extends AbstractException {
    constructor({
        keycloakId,
        sessionId,
        originalError,
    }: LoginSessionNotFoundExceptionMetadata = {
    }) {
        super(
            "Login session not found or already revoked",
            "LOGIN_SESSION_NOT_FOUND_EXCEPTION",
            {
                keycloakId,
                sessionId,
                originalError,
            },
        )
    }
}
