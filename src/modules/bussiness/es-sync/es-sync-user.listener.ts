import {
    Injectable,
    Logger,
    type OnModuleInit,
} from "@nestjs/common"
import {
    type EachMessagePayload,
} from "kafkajs"
import {
    envConfig,
} from "@modules/env"
import {
    KafkaCdcMessageException,
} from "@modules/exceptions"
import {
    KafkaService,
} from "@modules/kafka"
import {
    EsSyncUserService,
} from "./es-sync-user.service"
import type {
    UserCdcEnvelope,
} from "./types"

/**
 * Stable Kafka consumer group for the user → Elasticsearch sync. A fixed id
 * means restarts resume from the committed offset (no replay storm).
 */
const ES_SYNC_USER_GROUP_ID = "es-sync-user"

/**
 * Kafka CDC consumer that mirrors `public.users` row-changes into the
 * Elasticsearch `users` index.
 *
 * Debezium streams every insert/update/delete on `users` to the
 * `<prefix>users` topic; this listener takes the changed row's id and asks
 * {@link EsSyncUserService.reindexOne} to upsert (live user) or delete
 * (missing / soft-deleted) the corresponding document. The service re-reads the
 * authoritative row, so this listener only needs the id.
 *
 * This is NOT a CQRS projection (it writes to ES, not a Postgres read-model);
 * it owns its own Kafka wiring rather than extending the projection base.
 *
 * Boot is best-effort: if Kafka is unreachable (some environments run without
 * it) the failure is logged and swallowed so the app still starts. Delivery is
 * at-least-once, so duplicate re-indexes are harmless (the upsert is idempotent).
 */
@Injectable()
export class EsSyncUserListener implements OnModuleInit {
    /** Scoped logger so CDC issues are easy to grep in aggregated logs. */
    private readonly logger = new Logger(EsSyncUserListener.name)

    constructor(
        private readonly esSyncUserService: EsSyncUserService,
        private readonly kafkaService: KafkaService,
    ) {}

    /**
     * Subscribe to the `users` CDC topic and start consuming. Connection +
     * shutdown are delegated to {@link KafkaService}; any failure is logged and
     * swallowed so a missing broker never blocks application boot.
     */
    async onModuleInit(): Promise<void> {
        // CDC topic prefix is env-configurable (Debezium server + schema)
        const { cdcTopicPrefix } = envConfig().kafka
        // the single topic this listener follows — Debezium's `users` change feed
        const topic = `${cdcTopicPrefix}users`
        try {
            // ensure the topic exists so subscribe never trips on a cold broker
            await this.kafkaService.ensureTopics({
                topics: [
                    topic,
                ],
            })
            // stable group → resume from committed offset; KafkaService tracks it
            const { consumer } = await this.kafkaService.createConsumer({
                groupId: ES_SYNC_USER_GROUP_ID,
            })
            // only new changes (offsets committed per group), not a full replay
            await consumer.subscribe({
                topics: [
                    topic,
                ],
                fromBeginning: false,
            })
            // per-message loop; the handler is failure-isolated
            await consumer.run({
                eachMessage: (payload) => this.handleMessage(payload),
            })
            // confirm wiring so ops can see the sync is live
            this.logger.log(
                `es-sync-user CDC listener subscribed to: ${topic}`,
            )
        } catch (error) {
            // Kafka unreachable is non-fatal — log Error-style and let the app boot
            const cause = error instanceof Error ? error : new Error(String(error))
            this.logger.error(
                "es-sync-user CDC listener disabled (Kafka unavailable)",
                cause.stack,
            )
        }
    }

    /**
     * Process one CDC message: extract the changed user's id and re-sync it.
     * Errors are caught and logged (never thrown) so one bad message cannot
     * stall the consumer — the re-index is idempotent, so the next valid message
     * self-heals.
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
            // tombstone/null-value records carry no row image → nothing to do
            if (!message.value) {
                return
            }
            // parse the Debezium envelope; the flat row is `payload` (or top-level)
            const envelope = JSON.parse(message.value.toString()) as UserCdcEnvelope
            // some unwrap configs emit the row at top level → fall back to whole object
            const row = envelope.payload ?? envelope
            // no primary key on the row (malformed) → skip
            if (!row.id) {
                return
            }
            // upsert (live) or delete (gone/soft-deleted) the doc for this user
            await this.esSyncUserService.reindexOne({
                userId: row.id,
            })
        } catch (error) {
            // at-least-once delivery → swallow + log; a later message recovers.
            // wrap in a typed exception carrying a stable code + the source topic
            const exception = new KafkaCdcMessageException({
                topic,
                originalError: error instanceof Error ? error : undefined,
            })
            this.logger.error(exception.message,
                exception.stack)
        }
    }
}
