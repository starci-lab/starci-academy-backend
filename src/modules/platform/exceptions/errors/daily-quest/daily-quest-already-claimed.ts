import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link DailyQuestAlreadyClaimedException}. */
export interface DailyQuestAlreadyClaimedExceptionMetadata extends AbstractExceptionMetadata {
    /** The Asia/Ho_Chi_Minh calendar day the reward was already claimed for. */
    date: string
}

/**
 * The user already claimed the daily-quest reward for this calendar day.
 */
export class DailyQuestAlreadyClaimedException extends AbstractException {
    constructor(
        {
            date,
            originalError,
        }: DailyQuestAlreadyClaimedExceptionMetadata,
    ) {
        super(
            `Daily quest reward already claimed for ${date}`,
            "DAILY_QUEST_ALREADY_CLAIMED_EXCEPTION",
            {
                date,
                originalError,
            },
        )
    }
}
