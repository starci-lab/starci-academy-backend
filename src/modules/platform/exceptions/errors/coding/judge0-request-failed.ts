import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a failed Judge0 HTTP request. */
export interface Judge0RequestFailedExceptionMetadata extends AbstractExceptionMetadata {
    /** The Judge0 endpoint that was called (path only). */
    endpoint: string
    /** HTTP status code returned by Judge0, when a response was received. */
    statusCode?: number
    /** Truncated response body for debugging. */
    responseBody?: string
}

/**
 * Thrown when a call to the Judge0 REST API fails — non-2xx response, network
 * error, or request timeout. Wraps the underlying cause as `originalError`.
 */
export class Judge0RequestFailedException extends AbstractException {
    constructor({
        endpoint,
        statusCode,
        responseBody,
        originalError,
    }: Judge0RequestFailedExceptionMetadata) {
        super(
            `Judge0 request to ${endpoint} failed${statusCode ? ` (HTTP ${statusCode})` : ""}.`,
            "JUDGE0_REQUEST_FAILED_EXCEPTION",
            {
                endpoint,
                statusCode,
                responseBody,
                originalError,
            },
        )
    }
}
