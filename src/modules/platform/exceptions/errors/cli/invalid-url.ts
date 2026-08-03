import {
    AbstractException,
} from "../abstract"

/**
 * Thrown when a string is not a valid URL (e.g. PostgreSQL connection string parsing).
 */
export class InvalidUrlException extends AbstractException {
    constructor(
        urlString: string,
    ) {
        super(
            `Invalid URL: ${urlString}`,
            "INVALID_URL_EXCEPTION",
            {
                urlString,
            },
        )
    }
}
