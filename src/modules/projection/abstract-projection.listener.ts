import {
    Logger,
    type OnModuleInit,
} from "@nestjs/common"
import {
    type EachMessagePayload,
} from "kafkajs"
import {
    KafkaCdcMessageException,
} from "@modules/exceptions"
import {
    KafkaService,
} from "@modules/kafka"
import type {
    ProjectionCdcEnvelope,
    ProjectionCdcMessage,
} from "./types"

/**
 * Shared base for every CQRS projection CDC listener.
 *
 * Centralises the Kafka plumbing so each concrete projector only declares its
 * consumer group, the topics it follows, how to map a CDC row to its recompute
 * target(s), and how to recompute one target. Connection + shutdown are owned by
 * {@link KafkaService}; boot is best-effort (Kafka may be down in some
 * environments and must not block the app). One bad message is logged and
 * swallowed — recompute is an idempotent UPSERT, so the next message self-heals.
 *
 * @typeParam TTarget - the recompute key a CDC row resolves to (e.g. a contentId
 *   wrapper, or a `{ userId, courseId }`).
 */
export abstract class AbstractProjectionListener<TTarget> implements OnModuleInit {
    /** Logger scoped to the concrete subclass so issues are easy to grep. */
    protected readonly logger = new Logger(this.constructor.name)

    protected constructor(
        private readonly projectionKafkaService: KafkaService,
    ) {}

    /** Stable consumer group id (restarts resume from the committed offset). */
    protected abstract readonly groupId: string

    /** Fully-qualified CDC topics this projector subscribes to. */
    protected abstract readonly topics: Array<string>

    /**
     * Map one CDC row to the recompute target(s) it affects. Return an empty
     * array to skip (delete op / unresolvable parent / irrelevant column change).
     *
     * @param message - {@link ProjectionCdcMessage} (source topic + flat row).
     * @returns the targets to recompute (often 0 or 1).
     */
    protected abstract deriveTargets(
        message: ProjectionCdcMessage,
    ): Promise<Array<TTarget>> | Array<TTarget>

    /**
     * Recompute the projection for one derived target (idempotent UPSERT).
     *
     * @param target - one element returned by {@link deriveTargets}.
     */
    protected abstract recomputeTarget(target: TTarget): Promise<void>

    /**
     * Subscribe + start consuming on boot. Connection/shutdown delegated to
     * {@link KafkaService}; any failure is logged Error-style and swallowed.
     */
    async onModuleInit(): Promise<void> {
        try {
            // ensure topics exist so subscribe never trips on a cold broker
            await this.projectionKafkaService.ensureTopics({
                topics: this.topics,
            })
            // KafkaService connects the consumer + tracks it for shutdown
            const { consumer } = await this.projectionKafkaService.createConsumer({
                groupId: this.groupId,
            })
            // only new changes (offsets are committed per group)
            await consumer.subscribe({
                topics: this.topics,
                fromBeginning: false,
            })
            // per-message loop is failure-isolated inside handleMessage
            await consumer.run({
                eachMessage: (payload) => this.handleMessage(payload),
            })
            // confirm wiring so ops can see CDC is live
            this.logger.log(
                `${this.groupId} CDC listener subscribed to: ${this.topics.join(", ")}`,
            )
        } catch (error) {
            // Kafka unreachable is non-fatal — log Error-style + let the app boot
            const cause = error instanceof Error ? error : new Error(String(error))
            this.logger.error(
                `${this.groupId} CDC listener disabled (Kafka unavailable)`,
                cause.stack,
            )
        }
    }

    /**
     * Parse one CDC message, derive its target(s), recompute each. Errors are
     * caught + logged (never thrown) so one bad message cannot stall the loop.
     *
     * @param payload - the KafkaJS per-message payload (topic + raw value).
     */
    private async handleMessage(
        {
            topic,
            message,
        }: EachMessagePayload,
    ): Promise<void> {
        try {
            // tombstone/null-value records carry no row image → nothing to derive
            if (!message.value) {
                return
            }
            // unwrap the Debezium envelope (row may be nested or top-level)
            const envelope = JSON.parse(message.value.toString()) as ProjectionCdcEnvelope
            const row = envelope.payload ?? envelope
            // resolve which projection target(s) this change touches
            const targets = await this.deriveTargets({
                topic,
                row,
            })
            // recompute each affected target (idempotent UPSERT)
            for (const target of targets) {
                await this.recomputeTarget(target)
            }
        } catch (error) {
            // at-least-once delivery → swallow + log; a later message recovers
            const exception = new KafkaCdcMessageException({
                topic,
                originalError: error instanceof Error ? error : undefined,
            })
            this.logger.error(exception.message,
                exception.stack)
        }
    }
}
