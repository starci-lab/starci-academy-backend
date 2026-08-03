import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link StreakFreezeLimitReachedException}. */
export interface StreakFreezeLimitReachedExceptionMetadata extends AbstractExceptionMetadata {
    /** The maximum number of streak freezes a user may hold. */
    max: number
}

/**
 * The user already holds the maximum number of streak freezes.
 */
export class StreakFreezeLimitReachedException extends AbstractException {
    constructor(
        {
            max,
            originalError,
        }: StreakFreezeLimitReachedExceptionMetadata,
    ) {
        super(
            `Streak freeze limit reached: a user may hold at most ${max}`,
            "STREAK_FREEZE_LIMIT_REACHED_EXCEPTION",
            {
                max,
                originalError,
            },
        )
    }
}
