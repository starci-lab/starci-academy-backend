import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link RewardRedemptionAlreadyCancelledException}. */
export interface RewardRedemptionAlreadyCancelledExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the redemption ops tried to cancel. */
    redemptionId: string
}

/**
 * Thrown when `cancelRedemption` targets a redemption that is already
 * `cancelled` — guards against a double-refund read (the cost is already
 * excluded from the spent sum; cancelling again would be a confusing no-op).
 */
export class RewardRedemptionAlreadyCancelledException extends AbstractException {
    constructor(
        {
            redemptionId,
            originalError,
        }: RewardRedemptionAlreadyCancelledExceptionMetadata,
    ) {
        super(
            `Redemption "${redemptionId}" is already cancelled`,
            "REWARD_REDEMPTION_ALREADY_CANCELLED_EXCEPTION",
            {
                redemptionId,
                originalError,
            },
        )
    }
}
