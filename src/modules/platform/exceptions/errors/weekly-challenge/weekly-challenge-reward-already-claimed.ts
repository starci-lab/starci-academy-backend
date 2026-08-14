import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a reward claim the user has already made this week. */
export type WeeklyChallengeRewardAlreadyClaimedExceptionMetadata = AbstractExceptionMetadata

/**
 * The user already claimed the weekly-challenge reward for the current ISO
 * week.
 */
export class WeeklyChallengeRewardAlreadyClaimedException extends AbstractException {
    constructor(
        {
            originalError,
        }: WeeklyChallengeRewardAlreadyClaimedExceptionMetadata,
    ) {
        super(
            "Weekly-challenge reward already claimed this week",
            "WEEKLY_CHALLENGE_REWARD_ALREADY_CLAIMED_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
