import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a synchronous AI invoke that exceeded the configured timeout. */
export interface AiInvokeTimeoutExceptionMetadata extends AbstractExceptionMetadata {
    /** The configured invoke timeout, in milliseconds. */
    timeoutMs: number
}

/**
 * Thrown when {@link AiInvokeService.run} aborts an in-flight LLM call because
 * it exceeded `invokeTimeoutMs`.
 */
export class AiInvokeTimeoutException extends AbstractException {
    constructor({
        timeoutMs,
        originalError,
    }: AiInvokeTimeoutExceptionMetadata) {
        super(
            "AI invoke timed out.",
            "AI_INVOKE_TIMEOUT_EXCEPTION",
            {
                timeoutMs,
                originalError,
            },
            HttpStatus.GATEWAY_TIMEOUT,
        )
    }
}
