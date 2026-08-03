import type {
    Consumer,
    ConsumerConfig,
} from "kafkajs"

/**
 * Parameters for {@link import("../kafka.service").KafkaService.createConsumer}.
 * Wraps the subset of KafkaJS consumer config the app cares about; the service
 * owns the connection lifecycle so callers only describe the group + topics.
 */
export interface CreateConsumerParams {
    /**
     * Kafka consumer group id. A stable id makes restarts resume from the last
     * committed offset (no replay storm); a unique id per logical consumer keeps
     * offset bookkeeping isolated.
     */
    groupId: string
    /**
     * Optional extra KafkaJS consumer config merged over the defaults (e.g.
     * `sessionTimeout`, `heartbeatInterval`). Omit for the sane defaults.
     */
    config?: Partial<ConsumerConfig>
}

/**
 * Result of {@link import("../kafka.service").KafkaService.createConsumer}: the
 * created (already connected) consumer, ready for `subscribe` + `run`. The
 * service tracks it internally and disconnects it on shutdown.
 */
export interface CreateConsumerResult {
    /** The live, connected KafkaJS consumer. */
    consumer: Consumer
}

/**
 * Parameters for {@link import("../kafka.service").KafkaService.ensureTopics}.
 * Best-effort topic creation so a consumer never trips over "unknown topic"
 * when it boots before the producer/Debezium has created the topic.
 */
export interface EnsureTopicsParams {
    /** Fully-qualified topic names to create when missing. */
    topics: Array<string>
    /** Partition count for any topic that has to be created. Defaults to 1. */
    numPartitions?: number
}
