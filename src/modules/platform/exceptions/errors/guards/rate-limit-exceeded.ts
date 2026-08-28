import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Safe facts a client may use to explain when another attempt is useful. */
export interface RateLimitExceededExceptionMetadata extends AbstractExceptionMetadata {
    /** Whole seconds until the blocked window can accept another request. */
    retryAfterSeconds?: number
}

/** Stable boundary error for a request refused by the global throttler. */
export class RateLimitExceededException extends AbstractException {
    constructor({
        retryAfterSeconds,
        originalError,
    }: RateLimitExceededExceptionMetadata = {
    }) {
        super(
            "Too many requests.",
            "RATE_LIMIT_EXCEEDED_EXCEPTION",
            {
                retryAfterSeconds,
                originalError,
            },
            HttpStatus.TOO_MANY_REQUESTS,
        )
    }
}
