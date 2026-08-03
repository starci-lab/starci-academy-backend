import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link RewardRedemptionNotFoundException}. */
export interface RewardRedemptionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The redemption id the ops caller targeted. */
    redemptionId: string
}

/**
 * Thrown when an ops fulfil/cancel mutation targets a redemption id that
 * doesn't exist.
 */
export class RewardRedemptionNotFoundException extends AbstractException {
    constructor(
        {
            redemptionId,
            originalError,
        }: RewardRedemptionNotFoundExceptionMetadata,
    ) {
        super(
            `Reward redemption not found: "${redemptionId}"`,
            "REWARD_REDEMPTION_NOT_FOUND_EXCEPTION",
            {
                redemptionId,
                originalError,
            },
        )
    }
}
