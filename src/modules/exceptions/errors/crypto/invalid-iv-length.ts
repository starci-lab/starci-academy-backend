import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a decrypt call whose IV does not match the expected length. */
export interface InvalidIvLengthExceptionMetadata extends AbstractExceptionMetadata {
    /** The IV length (bytes) actually received. */
    actualLength: number
    /** The IV length (bytes) required by the cipher (`IV_LENGTH`). */
    expectedLength: number
}

/**
 * Thrown when {@link EncryptionService.decrypt} receives a payload whose
 * decoded IV does not match `IV_LENGTH` — the payload is malformed/tampered
 * before decryption is even attempted.
 */
export class InvalidIvLengthException extends AbstractException {
    constructor({
        actualLength,
        expectedLength,
        originalError,
    }: InvalidIvLengthExceptionMetadata) {
        super(
            "Invalid IV length.",
            "INVALID_IV_LENGTH_EXCEPTION",
            {
                actualLength,
                expectedLength,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
