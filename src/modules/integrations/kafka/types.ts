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
 * The slice of KafkaJS's internal `RequestQueue` that
 * {@link import("./request-queue-throttle-patch").applyKafkaRequestQueueThrottlePatch}
 * reads and writes. Declared structurally so the replacement scheduler can be
 * typed without depending on the (untyped) internal class itself.
 */
export interface KafkaRequestQueueInternals {
    /** Requests waiting on in-flight capacity or on a throttle window to close. */
    pending: Array<unknown>
    /**
     * ms-since-epoch when broker-side throttling ends, or the sentinel `-1`
     * while the queue has never been throttled.
     */
    throttledUntil: number
    /** Handle of the armed pending-request check; null when none is armed. */
    throttleCheckTimeoutId: NodeJS.Timeout | null
    /** Drains what capacity allows, then re-arms the pending-request check. */
    checkPendingRequests(): void
}

/**
 * What {@link import("./request-queue-throttle-patch").applyKafkaRequestQueueThrottlePatch}
 * did:
 * - `applied` -- the guard replaced KafkaJS's scheduler.
 * - `already-applied` -- a previous call had already installed it (idempotent).
 * - `skipped` -- the expected KafkaJS internals were not found, so the library
 *   was left untouched rather than patched blind.
 */
export type KafkaRequestQueueThrottlePatchOutcome =
    | "applied"
    | "already-applied"
    | "skipped"

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
