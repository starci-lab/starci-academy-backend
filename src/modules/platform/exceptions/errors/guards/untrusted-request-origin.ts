import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CSRF-guarded request whose Origin/Referer is not an allowed CORS origin. */
export interface UntrustedRequestOriginExceptionMetadata extends AbstractExceptionMetadata {
    /** The rejected origin. */
    origin: string
}

/**
 * Thrown by {@link CsrfGuard} when a request's Origin (or Referer-derived
 * origin) is present but not in the CORS allowlist.
 */
export class UntrustedRequestOriginException extends AbstractException {
    constructor({
        origin,
        originalError,
    }: UntrustedRequestOriginExceptionMetadata) {
        super(
            "Untrusted request origin.",
            "UNTRUSTED_REQUEST_ORIGIN_EXCEPTION",
            {
                origin,
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
