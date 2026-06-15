import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the weekly-league reset exception.
 */
export interface LeagueWeeklyResetExceptionMetadata extends AbstractExceptionMetadata {
    /** Start of the week window the reset was processing when it failed. */
    weekStartAt: string
}

/**
 * Thrown when the weekly-league reset job fails (closing ending cohorts,
 * promote/demote, or forming new cohorts). Wraps the underlying cause in
 * `originalError` so the cron wrapper can log a typed, groupable error. The
 * reset is idempotent on `weekStartAt`, so a failed run is safe to retry.
 */
export class LeagueWeeklyResetException extends AbstractException {
    constructor({
        weekStartAt,
        originalError,
    }: LeagueWeeklyResetExceptionMetadata) {
        super(
            `Weekly league reset failed for week starting "${weekStartAt}"`,
            "LEAGUE_WEEKLY_RESET_EXCEPTION",
            {
                weekStartAt,
                originalError,
            },
        )
    }
}
