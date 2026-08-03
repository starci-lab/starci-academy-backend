import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the AI quota-exhausted exception.
 */
export interface AiQuotaExhaustedExceptionMetadata extends AbstractExceptionMetadata {
    /** Window whose allowance was exhausted ("5h" | "week"), or "credit"/"category". */
    window: string
}

/**
 * Thrown by `AiEntitlementService.consume` when the user has no remaining
 * allowance in one of the sliding windows, or when the requested model
 * category is not unlocked by their entitlement.
 */
export class AiQuotaExhaustedException extends AbstractException {
    constructor({
        window,
        originalError,
    }: AiQuotaExhaustedExceptionMetadata) {
        super(
            `AI quota exhausted (${window})`,
            "AI_QUOTA_EXHAUSTED_EXCEPTION",
            {
                window,
                originalError,
            },
        )
    }
}
