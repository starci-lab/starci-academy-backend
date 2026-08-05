import {
    Inject,
    Injectable,
    type OnModuleDestroy,
} from "@nestjs/common"
import {
    Kafka,
    type Consumer,
} from "kafkajs"
import {
    KafkaConsumerConnectException,
    KafkaConsumerDisconnectException,
    KafkaEnsureTopicsException,
} from "@modules/exceptions"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    KAFKA,
} from "./constants"
import type {
    CreateConsumerParams,
    CreateConsumerResult,
    EnsureTopicsParams,
} from "./types"

@Injectable()
/**
 * Thin infrastructure wrapper around the shared {@link Kafka} client. It hides
 * broker/connection details from domain code: callers ask for a connected
 * consumer (or ensure topics exist) and the service owns the lifecycle --
 * tracking every consumer it hands out and disconnecting them on shutdown so
 * the broker rebalances promptly and Jest/graceful-shutdown never hangs.
 *
 * @example
 * const { consumer } = await kafkaService.createConsumer({ groupId: "progress" })
 * await consumer.subscribe({ topics, fromBeginning: false })
 * await consumer.run({ eachMessage })
 */
export class KafkaService implements OnModuleDestroy {
    /** Every consumer handed out, retained so they can be disconnected on shutdown. */
    private readonly consumers: Array<Consumer> = []

    constructor(
        @Inject(KAFKA)
        private readonly kafka: Kafka,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Create + connect a consumer for the given group and register it for
     * cleanup. The caller still drives `subscribe`/`run` -- this only removes the
     * client-construction + connect boilerplate and centralises disconnect.
     *
     * @param params - {@link CreateConsumerParams}
     * @returns {@link CreateConsumerResult} carrying the connected consumer.
     *
     * @example
     * const { consumer } = await kafkaService.createConsumer({ groupId: "progress" })
     */
    async createConsumer(
        {
            groupId,
            config,
        }: CreateConsumerParams,
    ): Promise<CreateConsumerResult> {
        // build the consumer for the requested group, merging any extra config
        const consumer = this.kafka.consumer({
            groupId,
            ...config,
        })
        try {
            // open the TCP connection + join the consumer group up front so the
            // caller can subscribe/run immediately
            await consumer.connect()
        } catch (error) {
            // surface a typed, code-tagged failure carrying the broker error so
            // the caller can log it Error-style (stack preserved) or branch on code
            throw new KafkaConsumerConnectException({
                groupId,
                originalError: error instanceof Error ? error : undefined,
            })
        }
        // retain it so onModuleDestroy can disconnect every consumer we created
        this.consumers.push(consumer)
        return {
            consumer,
        }
    }

    /**
     * Best-effort topic creation via the Kafka admin client. Avoids the
     * "unknown topic" race when a consumer boots before the producer (or
     * Debezium) has created the topic. Existing topics are left untouched and a
     * broker that rejects the call is logged, not thrown -- topic auto-create may
     * be enabled, making this a no-op.
     *
     * @param params - {@link EnsureTopicsParams}
     *
     * @example
     * await kafkaService.ensureTopics({ topics: ["starci.public.enrollments"] })
     */
    async ensureTopics(
        {
            topics,
            numPartitions = 1,
        }: EnsureTopicsParams,
    ): Promise<void> {
        // nothing requested -> skip opening an admin connection entirely
        if (topics.length === 0) {
            return
        }
        // the admin client is short-lived: connect, create, disconnect
        const admin = this.kafka.admin()
        try {
            // join the broker as an admin
            await admin.connect()
            // Only create topics that are actually missing. `createTopics` is
            // idempotent (returns false for existing topics without throwing),
            // but the broker still answers CreateTopics with a per-topic
            // TOPIC_ALREADY_EXISTS error, which kafkajs's own Connection logger
            // prints at ERROR level on every boot. Diffing against the live
            // topic list first means we never send CreateTopics for topics that
            // already exist, so that recurring noise disappears.
            const existing = new Set(await admin.listTopics())
            const missing = topics.filter((topic) => !existing.has(topic))
            if (missing.length > 0) {
                await admin.createTopics({
                    topics: missing.map((topic) => ({
                        topic,
                        numPartitions,
                    })),
                })
            }
        } catch (error) {
            // wrap the broker error in a typed exception so the log carries a
            // stable code + the original stack; non-fatal because topic
            // auto-create may be enabled, so log Error-style rather than throw
            const exception = new KafkaEnsureTopicsException({
                topics,
                originalError: error instanceof Error ? error : undefined,
            })
            this.winstonService.log(WinstonLog.RequestHandlingFailed,
                {
                    op: "integration.kafka.ensure-topics-failed",
                    error: exception.message,
                    meta: {
                        topics,
                    },
                })
        } finally {
            // always release the admin socket so it does not leak
            await admin.disconnect().catch(() => {
                // swallow: a noisy admin disconnect must not mask the real outcome
            })
        }
    }

    /**
     * Disconnect every consumer created through this service so the broker
     * rebalances the groups promptly on shutdown. Each disconnect is isolated so
     * one failure does not abort the rest.
     */
    async onModuleDestroy(): Promise<void> {
        // tear down each tracked consumer independently
        for (const consumer of this.consumers) {
            try {
                // leave the group + close sockets cleanly
                await consumer.disconnect()
            } catch (error) {
                // a noisy disconnect must not crash shutdown -> log Error-style,
                // preserving the original broker stack via the typed exception
                const exception = new KafkaConsumerDisconnectException({
                    originalError: error instanceof Error ? error : undefined,
                })
                this.winstonService.log(WinstonLog.RequestHandlingFailed,
                    {
                        op: "integration.kafka.consumer-disconnect-failed",
                        error: exception.message,
                    })
            }
        }
    }
}
