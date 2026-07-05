import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link InsufficientRewardPointsException}. */
export interface InsufficientRewardPointsExceptionMetadata extends AbstractExceptionMetadata {
    /** The user's current spendable Coin balance. */
    balance: number
    /** The cost of the reward being redeemed. */
    cost: number
}

/**
 * The user's spendable Coin balance is below the reward's cost.
 *
 * NOTE: class/code name kept as `RewardPoints` for now (Coin rename touched
 * the balance field + copy only, not this exception's public name — renaming
 * it ripples through every catch-site; do in a dedicated follow-up).
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
            `Not enough Coin to redeem: have ${balance}, need ${cost}`,
            "INSUFFICIENT_REWARD_POINTS_EXCEPTION",
            {
                balance,
                cost,
                originalError,
            },
        )
    }
}
