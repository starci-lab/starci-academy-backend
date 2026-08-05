import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown when a URL is syntactically valid but does not use a PostgreSQL scheme. */
export interface InvalidPostgresUrlExceptionMetadata extends AbstractExceptionMetadata {
    /** The URL that was rejected for using the wrong scheme. */
    urlString: string
}

/**
 * Thrown when a URL is syntactically valid but does not use a PostgreSQL scheme.
 */
export class InvalidPostgresUrlException extends AbstractException {
    constructor(
        {
            urlString,
            originalError,
        }: InvalidPostgresUrlExceptionMetadata,
    ) {
        super(
            `URL must use postgresql:// or postgres:// scheme. Received: ${urlString}`,
            "INVALID_POSTGRES_URL_EXCEPTION",
            {
                urlString,
                originalError,
            },
        )
    }
}
