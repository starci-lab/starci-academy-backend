import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** User + window that tripped the content-access scrape cap. */
export interface ContentScrapeRateLimitExceptionMetadata extends AbstractExceptionMetadata {
    /** The offending user's id. */
    userId?: string
    /** How many content reads this user made inside the window. */
    count?: number
    /** The configured per-window limit that was exceeded. */
    limit?: number
}

/**
 * Thrown when a single user reads too many lesson contents within the rolling
 * window (suspected bulk scraping). Blocks further reads until the window rolls
 * over; the offender is also logged (with email) for account review / takedown.
 */
export class ContentScrapeRateLimitException extends AbstractException {
    constructor({
        userId,
        count,
        limit,
        originalError,
    }: ContentScrapeRateLimitExceptionMetadata) {
        super(
            "Too many content requests. Please slow down and try again later.",
            "CONTENT_SCRAPE_RATE_LIMIT_EXCEPTION",
            {
                userId,
                count,
                limit,
                originalError,
            },
        )
    }
}
