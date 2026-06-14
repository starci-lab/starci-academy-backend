/**
 * DI injection token for the shared KafkaJS {@link import("kafkajs").Kafka} client.
 * The client is created once by {@link createKafkaProvider} and reused by every
 * consumer/admin so the broker sees a single connection pool per process.
 */
export const KAFKA = "KAFKA"
