import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CSRF check missing the header token and/or cookie tokens. */
export type CsrfMissingTokenExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link CsrfGuard} when either the `X-CSRF-Token` header or the
 * `csrf_token` cookie is absent -- both halves of the double-submit are
 * required.
 */
export class CsrfMissingTokenException extends AbstractException {
    constructor({
        originalError,
    }: CsrfMissingTokenExceptionMetadata) {
        super(
            "Missing CSRF token.",
            "CSRF_MISSING_TOKEN_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
