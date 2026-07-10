import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CSRF token whose HMAC signature fails verification. */
export type InvalidCsrfTokenExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link CsrfGuard} when the double-submitted token does not carry
 * a signature this server issued.
 */
export class InvalidCsrfTokenException extends AbstractException {
    constructor({
        originalError,
    }: InvalidCsrfTokenExceptionMetadata) {
        super(
            "Invalid CSRF token.",
            "INVALID_CSRF_TOKEN_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
