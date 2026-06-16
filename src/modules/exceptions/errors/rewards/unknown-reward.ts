import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link UnknownRewardException}. */
export interface UnknownRewardExceptionMetadata extends AbstractExceptionMetadata {
    /** The reward key the caller asked to redeem. */
    rewardKey: string
}

/**
 * The requested reward key does not exist in the code-defined catalog.
 */
export class UnknownRewardException extends AbstractException {
    constructor(
        {
            rewardKey,
            originalError,
        }: UnknownRewardExceptionMetadata,
    ) {
        super(
            `Unknown reward key: "${rewardKey}"`,
            "UNKNOWN_REWARD_EXCEPTION",
            {
                rewardKey,
                originalError,
            },
        )
    }
}
