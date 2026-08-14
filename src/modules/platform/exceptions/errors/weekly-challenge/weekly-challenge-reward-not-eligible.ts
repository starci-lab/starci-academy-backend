import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a reward claim made before the week's challenge was passed. */
export type WeeklyChallengeRewardNotEligibleExceptionMetadata = AbstractExceptionMetadata

/**
 * The user tried to claim the weekly-challenge reward without having passed
 * the current week's featured challenge.
 */
export class WeeklyChallengeRewardNotEligibleException extends AbstractException {
    constructor(
        {
            originalError,
        }: WeeklyChallengeRewardNotEligibleExceptionMetadata,
    ) {
        super(
            "Weekly-challenge reward not eligible yet — the current challenge hasn't been passed",
            "WEEKLY_CHALLENGE_REWARD_NOT_ELIGIBLE_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
