import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CSRF header token that matches none of the request's cookie tokens. */
export type CsrfTokenMismatchExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link CsrfGuard} when the `X-CSRF-Token` header does not match
 * any `csrf_token` cookie value on the request.
 */
export class CsrfTokenMismatchException extends AbstractException {
    constructor({
        originalError,
    }: CsrfTokenMismatchExceptionMetadata) {
        super(
            "CSRF token mismatch.",
            "CSRF_TOKEN_MISMATCH_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
