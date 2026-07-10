import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CSRF check with no underlying HTTP request on the GraphQL context. */
export type CsrfMissingHttpRequestExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link CsrfGuard} when the GraphQL context carries no `req` —
 * fails closed since there is nothing to validate.
 */
export class CsrfMissingHttpRequestException extends AbstractException {
    constructor({
        originalError,
    }: CsrfMissingHttpRequestExceptionMetadata) {
        super(
            "Missing HTTP request for CSRF check.",
            "CSRF_MISSING_HTTP_REQUEST_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
