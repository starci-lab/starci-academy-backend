import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the AI mode-not-entitled exception.
 */
export interface AiModeNotEntitledExceptionMetadata extends AbstractExceptionMetadata {
    /** Lane the caller requested ("auto" | "premium" | "byok"). */
    requestedMode: string
    /** Short reason the request was rejected. */
    reason: string
}

/**
 * Thrown by `AiEntitlementService` when a caller asks to run on a lane the
 * user is not entitled to — e.g. requesting `premium` without an active
 * subscription, or `byok` without supplying a key.
 */
export class AiModeNotEntitledException extends AbstractException {
    constructor({
        requestedMode,
        reason,
        originalError,
    }: AiModeNotEntitledExceptionMetadata) {
        super(
            `AI mode "${requestedMode}" not available: ${reason}`,
            "AI_MODE_NOT_ENTITLED_EXCEPTION",
            {
                requestedMode,
                reason,
                originalError,
            },
        )
    }
}
