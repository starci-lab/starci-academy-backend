import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the AI subscription tier-not-available exception.
 */
export interface AiSubscriptionTierNotAvailableExceptionMetadata extends AbstractExceptionMetadata {
    /** Tier id the caller asked to purchase. */
    tier: string
}

/**
 * Thrown when a user tries to purchase an AI subscription tier that is not in
 * the catalog or is disabled (`enabled: false`) in `app.yaml`.
 */
export class AiSubscriptionTierNotAvailableException extends AbstractException {
    constructor({
        tier,
        originalError,
    }: AiSubscriptionTierNotAvailableExceptionMetadata) {
        super(
            `AI subscription tier "${tier}" is not available for purchase`,
            "AI_SUBSCRIPTION_TIER_NOT_AVAILABLE_EXCEPTION",
            {
                tier,
                originalError,
            },
        )
    }
}
