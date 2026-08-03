import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for the daily activity-digest cron exception. */
export interface SocialDigestFailedExceptionMetadata extends AbstractExceptionMetadata {
}

/**
 * Thrown when the daily activity-digest sweep fails before it can finish
 * (the aggregation query, most likely). Wraps the underlying cause in
 * `originalError` so the cron wrapper can log a typed, groupable error
 * instead of a bare `Error`. The sweep is idempotent (fixed 24h window run
 * once a day), so a failed run is safe to retry the next day.
 */
export class SocialDigestFailedException extends AbstractException {
    constructor({
        originalError,
    }: SocialDigestFailedExceptionMetadata) {
        super(
            "Daily activity-digest sweep failed",
            "SOCIAL_DIGEST_FAILED_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
