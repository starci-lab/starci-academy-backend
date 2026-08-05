import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown when a string is not a valid URL (e.g. PostgreSQL connection string parsing). */
export interface InvalidUrlExceptionMetadata extends AbstractExceptionMetadata {
    /** The string that failed to parse as a URL. */
    urlString: string
}

/**
 * Thrown when a string is not a valid URL (e.g. PostgreSQL connection string parsing).
 */
export class InvalidUrlException extends AbstractException {
    constructor(
        {
            urlString,
            originalError,
        }: InvalidUrlExceptionMetadata,
    ) {
        super(
            `Invalid URL: ${urlString}`,
            "INVALID_URL_EXCEPTION",
            {
                urlString,
                originalError,
            },
        )
    }
}
