import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a rejected two-factor verification attempt. */
export interface TwoFactorInvalidCodeExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user whose code failed verification. */
    userId: string
}

/**
 * Thrown when a user-supplied TOTP code does not match (wrong code, expired
 * step beyond the skew window, or no pending secret to verify against).
 */
export class TwoFactorInvalidCodeException extends AbstractException {
    constructor({
        userId,
        originalError,
    }: TwoFactorInvalidCodeExceptionMetadata) {
        super(
            "Invalid two-factor code",
            "TWO_FACTOR_INVALID_CODE_EXCEPTION",
            {
                userId,
                originalError,
            },
        )
    }
}
