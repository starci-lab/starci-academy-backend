import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the Kafka CDC-message exception.
 */
export interface KafkaCdcMessageExceptionMetadata extends AbstractExceptionMetadata {
    /** The CDC topic the failed message was consumed from. */
    topic: string
}

/**
 * Logged by a CDC consumer when one message cannot be processed (parse failure,
 * derive/lookup error, recompute failure). Wraps the cause in `originalError`.
 * Delivery is at-least-once, so this is swallowed + logged -- a later message
 * self-heals the projection rather than stalling the consumer.
 */
export class KafkaCdcMessageException extends AbstractException {
    constructor({
        topic,
        originalError,
    }: KafkaCdcMessageExceptionMetadata) {
        super(
            `Failed to process CDC message from topic "${topic}"`,
            "KAFKA_CDC_MESSAGE_EXCEPTION",
            {
                topic,
                originalError,
            },
        )
    }
}
