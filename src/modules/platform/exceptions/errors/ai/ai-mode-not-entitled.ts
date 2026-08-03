import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the AI not-entitled exception.
 */
export interface AiModeNotEntitledExceptionMetadata extends AbstractExceptionMetadata {
    /** Short reason the request was rejected. */
    reason: string
}

/**
 * Thrown by `AiEntitlementService` when a caller asks to use paid-tier models
 * they are not entitled to — e.g. pinning a higher-tier model without an active
 * paid subscription or an enrollment.
 */
export class AiModeNotEntitledException extends AbstractException {
    constructor({
        reason,
        originalError,
    }: AiModeNotEntitledExceptionMetadata) {
        super(
            `AI access not available: ${reason}`,
            "AI_MODE_NOT_ENTITLED_EXCEPTION",
            {
                reason,
                originalError,
            },
        )
    }
}
