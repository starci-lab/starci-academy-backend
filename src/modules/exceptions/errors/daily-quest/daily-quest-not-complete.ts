import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link DailyQuestNotCompleteException}. */
export interface DailyQuestNotCompleteExceptionMetadata extends AbstractExceptionMetadata {
    /** The Asia/Ho_Chi_Minh calendar day the claim was attempted for. */
    date: string
}

/**
 * The user tried to claim the daily-quest reward before completing every task.
 */
export class DailyQuestNotCompleteException extends AbstractException {
    constructor(
        {
            date,
            originalError,
        }: DailyQuestNotCompleteExceptionMetadata,
    ) {
        super(
            `Daily quest is not complete yet for ${date}`,
            "DAILY_QUEST_NOT_COMPLETE_EXCEPTION",
            {
                date,
                originalError,
            },
        )
    }
}
