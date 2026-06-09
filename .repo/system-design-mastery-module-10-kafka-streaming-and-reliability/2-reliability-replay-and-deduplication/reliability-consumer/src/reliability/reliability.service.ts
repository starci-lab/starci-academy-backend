/**
 * Idempotent consumer — dedup Redis + persist Postgres + simulate failure.
 * (EN: Idempotent consumer — Redis dedup + Postgres persist + simulated failure.)
 */
import {
    ConflictException,
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import Redis from "ioredis"
import {
    Kafka,
    Producer,
} from "kafkajs"
import {
    ProcessedEventEntity,
} from "../entities"
import type {
    KafkaConfig,
    RedisConfig,
} from "../config"
import type {
    ProcessEventPayload,
} from "./dto"

@Injectable()
/**
 * Class `ReliabilityService` — lesson lab component.
 */
export class ReliabilityService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ReliabilityService.name)
    private redis!: Redis
    private dlqProducer!: Producer

    constructor(
        @InjectRepository(ProcessedEventEntity) private readonly repo: Repository<ProcessedEventEntity>,
        private readonly config: ConfigService,
    ) {}
/**
 * Logic: Initialize clients when the module becomes ready.
 * Code: `OnModuleInit` hook: read `ConfigService` and open connections (Redis + DLQ Kafka producer).
 */
    async onModuleInit(): Promise<void> {
        const redis = this.config.getOrThrow<RedisConfig>("redis")
        this.redis = new Redis({
            host: redis.host,
            port: redis.port,
        })
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        // Dedicated producer used only to publish failed messages to the DLQ topic.
        this.dlqProducer = new Kafka({
            clientId: `${kafka.clientId}-dlq`,
            brokers: kafka.brokers,
        }).producer()
        await this.dlqProducer.connect()
    }
/**
 * Logic: Gracefully close connections on shutdown.
 * Code: `OnModuleDestroy` hook: `quit()` / `disconnect()` on clients.
 */
    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
        await this.dlqProducer?.disconnect()
    }

    /**
     * Logic: Idempotent path via SETNX on clientMessageId; INCR sequence; simulateFailure triggers retry/DLQ.
     * Code: redis.set NX → ConflictException on duplicate; repo.save; log topic.
     */
    async processEvent(data: ProcessEventPayload): Promise<ProcessedEventEntity> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        const { clientMessageId, type, simulateFailure } = data

        const dedupKey = `dedup:event:${clientMessageId}`
        const lock = await this.redis.set(dedupKey, "1", "EX", 3600, "NX")
        if (lock !== "OK") {
            throw new ConflictException(`Duplicate clientMessageId: ${clientMessageId}`)
        }

        if (simulateFailure) {
            throw new Error("Simulated processing failure for DLQ demo")
        }

        const seq = await this.redis.incr("reliability:sequence")
        const row = this.repo.create({ clientMessageId, eventType: type, sequence: seq })
        const saved = await this.repo.save(row)
        this.logger.log(`Processed ${clientMessageId} seq=${seq} topic=${kafka.topic}`)
        return saved
    }

    /**
     * Logic: Park a poison message into the DLQ topic so it is isolated for manual replay
     *        instead of blocking the partition with infinite retries.
     * Code: produce the original envelope (key = clientMessageId) to `kafka.dlqTopic`.
     */
    async publishToDlq(data: ProcessEventPayload): Promise<void> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        await this.dlqProducer.send({
            topic: kafka.dlqTopic,
            messages: [
                {
                    key: data.clientMessageId,
                    value: JSON.stringify(data),
                },
            ],
        })
    }
}
