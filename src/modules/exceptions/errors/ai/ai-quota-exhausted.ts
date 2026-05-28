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
    /** Entitlement mode that ran out of allowance ("auto" | "premium" | "byok"). */
    mode: string
    /** Window whose allowance was exhausted ("5h" | "week"), or "category" when the category is not allowed. */
    window: string
}

/**
 * Thrown by `AiEntitlementService.consume` when the user has no remaining
 * allowance in one of the sliding windows, or when the requested model
 * category is not unlocked by their entitlement.
 */
export class AiQuotaExhaustedException extends AbstractException {
    constructor({
        mode,
        window,
        originalError,
    }: AiQuotaExhaustedExceptionMetadata) {
        super(
            `AI quota exhausted for mode "${mode}" (${window})`,
            "AI_QUOTA_EXHAUSTED_EXCEPTION",
            {
                mode,
                window,
                originalError,
            },
        )
    }
}
