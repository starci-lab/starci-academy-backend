import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the Kafka consumer-disconnect exception.
 */
export type KafkaConsumerDisconnectExceptionMetadata = AbstractExceptionMetadata

/**
 * Logged by `KafkaService.onModuleDestroy` when a tracked consumer fails to
 * disconnect cleanly on shutdown. Wraps the underlying KafkaJS error in
 * `originalError`. Non-fatal: a noisy disconnect must not crash shutdown.
 */
export class KafkaConsumerDisconnectException extends AbstractException {
    constructor({
        originalError,
    }: KafkaConsumerDisconnectExceptionMetadata) {
        super(
            "Failed to disconnect Kafka consumer on shutdown",
            "KAFKA_CONSUMER_DISCONNECT_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
