import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a streaming AI invoke that exceeded the configured timeout. */
export interface AiStreamTimeoutExceptionMetadata extends AbstractExceptionMetadata {
    /** The configured invoke timeout, in milliseconds. */
    timeoutMs: number
}

/**
 * Thrown when {@link AiInvokeService.stream} aborts an in-flight LLM stream
 * because it exceeded `invokeTimeoutMs`.
 */
export class AiStreamTimeoutException extends AbstractException {
    constructor({
        timeoutMs,
        originalError,
    }: AiStreamTimeoutExceptionMetadata) {
        super(
            "AI stream timed out.",
            "AI_STREAM_TIMEOUT_EXCEPTION",
            {
                timeoutMs,
                originalError,
            },
            HttpStatus.GATEWAY_TIMEOUT,
        )
    }
}
