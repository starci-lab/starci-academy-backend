import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a request whose session was superseded by a newer login. */
export interface SessionSupersededExceptionMetadata extends AbstractExceptionMetadata {
    /** The user id whose session was superseded. */
    userId: string
}

/**
 * Thrown by {@link SessionService.assertCurrent} when the presented request
 * either carries no session id, or an id no longer among the account's
 * active sessions — the device was evicted by a newer login or revoked
 * elsewhere.
 */
export class SessionSupersededException extends AbstractException {
    constructor({
        userId,
        originalError,
    }: SessionSupersededExceptionMetadata) {
        super(
            "Session has been superseded by a newer login.",
            "SESSION_SUPERSEDED_EXCEPTION",
            {
                userId,
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
