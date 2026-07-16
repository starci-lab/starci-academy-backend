import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * The user already claimed the weekly-challenge reward for the current ISO
 * week.
 */
export class WeeklyChallengeRewardAlreadyClaimedException extends AbstractException {
    constructor(
        {
            originalError,
        }: AbstractExceptionMetadata,
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
