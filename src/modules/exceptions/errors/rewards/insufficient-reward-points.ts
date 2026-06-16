import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link InsufficientRewardPointsException}. */
export interface InsufficientRewardPointsExceptionMetadata extends AbstractExceptionMetadata {
    /** The user's current spendable reward-points balance. */
    balance: number
    /** The cost of the reward being redeemed. */
    cost: number
}

/**
 * The user's spendable reward-points balance is below the reward's cost.
 */
export class InsufficientRewardPointsException extends AbstractException {
    constructor(
        {
            balance,
            cost,
            originalError,
        }: InsufficientRewardPointsExceptionMetadata,
    ) {
        super(
            `Not enough reward points to redeem: have ${balance}, need ${cost}`,
            "INSUFFICIENT_REWARD_POINTS_EXCEPTION",
            {
                balance,
                cost,
                originalError,
            },
        )
    }
}
