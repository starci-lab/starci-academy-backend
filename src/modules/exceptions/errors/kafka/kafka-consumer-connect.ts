import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the Kafka consumer-connect exception.
 */
export interface KafkaConsumerConnectExceptionMetadata extends AbstractExceptionMetadata {
    /** The consumer group id whose connection/join failed. */
    groupId: string
}

/**
 * Thrown by `KafkaService.createConsumer` when the consumer cannot connect to
 * the broker or join its group. Wraps the underlying KafkaJS error in
 * `originalError`; the caller (a listener) typically logs it best-effort so the
 * app still boots when Kafka is unavailable.
 */
export class KafkaConsumerConnectException extends AbstractException {
    constructor({
        groupId,
        originalError,
    }: KafkaConsumerConnectExceptionMetadata) {
        super(
            `Failed to connect Kafka consumer for group "${groupId}"`,
            "KAFKA_CONSUMER_CONNECT_EXCEPTION",
            {
                groupId,
                originalError,
            },
        )
    }
}
