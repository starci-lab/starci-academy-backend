import type {
    Provider,
} from "@nestjs/common"
import {
    Kafka,
} from "kafkajs"
import {
    envConfig,
} from "@modules/env"
import {
    KAFKA,
} from "./constants"

/**
 * Creates the singleton {@link Kafka} client provider bound to the {@link KAFKA}
 * token. The broker list comes from `envConfig().kafka` so it is overridable per
 * environment; a fixed `clientId` makes this process identifiable on the broker.
 *
 * @returns The NestJS provider that constructs the shared Kafka client.
 *
 * @example
 * // wired internally by KafkaModule.register()
 * providers: [createKafkaProvider(), KafkaService]
 */
export const createKafkaProvider = (): Provider => ({
    provide: KAFKA,
    inject: [],
    useFactory: (): Kafka => {
        // pull the broker endpoints from env (defaults to the local KRaft broker)
        const { brokers } = envConfig().kafka
        // one client per process → KafkaJS pools sockets across all consumers
        return new Kafka({
            clientId: "starci-academy",
            brokers,
        })
    },
})
