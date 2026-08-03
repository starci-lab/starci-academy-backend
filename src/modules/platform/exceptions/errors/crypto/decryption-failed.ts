import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an AES-256-GCM decrypt that failed (bad key/tampered ciphertext/auth tag mismatch). */
export type DecryptionFailedExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when {@link EncryptionService.decrypt} fails for any reason other
 * than an invalid IV length (wrong key, tampered ciphertext, auth-tag
 * mismatch). Always carries `originalError` — decrypt failures are otherwise
 * very hard to diagnose without the underlying `crypto` error.
 */
export class DecryptionFailedException extends AbstractException {
    constructor({
        originalError,
    }: DecryptionFailedExceptionMetadata) {
        super(
            "Failed to decrypt data.",
            "DECRYPTION_FAILED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
