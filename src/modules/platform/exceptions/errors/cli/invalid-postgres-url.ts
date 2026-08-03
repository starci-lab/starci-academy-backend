import {
    AbstractException,
} from "../abstract"

/**
 * Thrown when a URL is syntactically valid but does not use a PostgreSQL scheme.
 */
export class InvalidPostgresUrlException extends AbstractException {
    constructor(
        urlString: string,
    ) {
        super(
            `URL must use postgresql:// or postgres:// scheme. Received: ${urlString}`,
            "INVALID_POSTGRES_URL_EXCEPTION",
            {
                urlString,
            },
        )
    }
}
