/**
 * Config namespace `kafka` — environment variables in registerAs factory.
 */
import {
    registerAs,
} from "@nestjs/config"

export interface KafkaConfig {
    brokers: Array<string>
    topic: string
    dlqTopic: string
    groupId: string
    clientId: string
    consumerDelayMs: number
}

/**
 * Logic: Map environment variables to typed config.
 * Code: `registerAs` factory reading `process.env.*`.
 */
export const kafkaConfig = registerAs(
    "kafka",
    (): KafkaConfig => ({
        brokers: (process.env.KAFKA_BROKERS ?? "kafka:9092").split(","),
        topic: process.env.KAFKA_TOPIC ?? "platform-events",
        dlqTopic: process.env.KAFKA_DLQ_TOPIC ?? "platform-events-dlq",
        groupId: process.env.KAFKA_GROUP_ID ?? "broker-demo-group",
        clientId: process.env.KAFKA_CLIENT_ID ?? "broker-client",
        consumerDelayMs: Number(process.env.CONSUMER_DELAY_MS) || 0,
    }),
)
