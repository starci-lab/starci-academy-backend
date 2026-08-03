import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the Kafka ensure-topics exception.
 */
export interface KafkaEnsureTopicsExceptionMetadata extends AbstractExceptionMetadata {
    /** The fully-qualified topic names the admin client failed to create. */
    topics: Array<string>
}

/**
 * Thrown/logged by `KafkaService.ensureTopics` when the admin client cannot
 * create the requested topics (broker rejected the call, perms, etc.). Wraps
 * the underlying broker error in `originalError`. Non-fatal: topic auto-create
 * may be enabled, so callers log this rather than crash.
 */
export class KafkaEnsureTopicsException extends AbstractException {
    constructor({
        topics,
        originalError,
    }: KafkaEnsureTopicsExceptionMetadata) {
        super(
            `Failed to ensure Kafka topics: [${topics.join(", ")}]`,
            "KAFKA_ENSURE_TOPICS_EXCEPTION",
            {
                topics,
                originalError,
            },
        )
    }
}
