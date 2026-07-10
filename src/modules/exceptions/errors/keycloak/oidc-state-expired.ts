import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an OIDC redirect whose state cookie/param is expired or invalid. */
export type OidcStateExpiredExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when the OIDC redirect handler cannot decrypt/validate the `state`
 * round-tripped through the identity provider — the sign-in session expired
 * or the state was tampered with; the caller must restart sign-in.
 */
export class OidcStateExpiredException extends AbstractException {
    constructor({
        originalError,
    }: OidcStateExpiredExceptionMetadata) {
        super(
            "OAuth session expired or invalid state. Restart sign-in.",
            "OIDC_STATE_EXPIRED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
