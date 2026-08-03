import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the invalid-BYOK-input exception.
 */
export interface AiByokInvalidExceptionMetadata extends AbstractExceptionMetadata {
    /** Short reason the BYOK input was rejected. */
    reason: string
}

/**
 * Thrown by `AiEntitlementService` when a BYOK update is malformed — e.g. an
 * API key supplied without a provider, or selecting the `byok` lane without a
 * key on file.
 */
export class AiByokInvalidException extends AbstractException {
    constructor({
        reason,
        originalError,
    }: AiByokInvalidExceptionMetadata) {
        super(
            `Invalid BYOK input: ${reason}`,
            "AI_BYOK_INVALID_EXCEPTION",
            {
                reason,
                originalError,
            },
        )
    }
}
