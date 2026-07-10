import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Cloudflare Turnstile verification that failed or was absent. */
export type CaptchaVerificationFailedExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link CaptchaGuard} when the Cloudflare Turnstile token is
 * missing or fails verification.
 */
export class CaptchaVerificationFailedException extends AbstractException {
    constructor({
        originalError,
    }: CaptchaVerificationFailedExceptionMetadata) {
        super(
            "Captcha verification failed.",
            "CAPTCHA_VERIFICATION_FAILED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
