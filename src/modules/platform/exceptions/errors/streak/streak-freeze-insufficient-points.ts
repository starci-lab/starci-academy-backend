import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link StreakFreezeInsufficientPointsException}. */
export interface StreakFreezeInsufficientPointsExceptionMetadata extends AbstractExceptionMetadata {
    /** The user's current points balance. */
    points: number
    /** The cost of one streak freeze. */
    cost: number
}

/**
 * The user does not have enough points to buy a streak freeze.
 */
export class StreakFreezeInsufficientPointsException extends AbstractException {
    constructor(
        {
            points,
            cost,
            originalError,
        }: StreakFreezeInsufficientPointsExceptionMetadata,
    ) {
        super(
            `Not enough points to buy a streak freeze: have ${points}, need ${cost}`,
            "STREAK_FREEZE_INSUFFICIENT_POINTS_EXCEPTION",
            {
                points,
                cost,
                originalError,
            },
        )
    }
}
