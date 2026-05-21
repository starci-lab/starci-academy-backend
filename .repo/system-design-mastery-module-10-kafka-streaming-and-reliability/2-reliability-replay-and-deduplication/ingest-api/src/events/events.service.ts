/**
 * Service lesson — Kafka producer reliability-events.
 * (EN: Lesson service — Kafka producer for reliability-events.)
 */
import {
    Inject,
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    ClientKafka,
} from "@nestjs/microservices"
import {
    ConfigService,
} from "@nestjs/config"
import type {
    KafkaConfig,
} from "../config"
import {
    PublishEventDto,
} from "./dto"

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name)

    constructor(
        @Inject("KAFKA_PRODUCER") private readonly kafka: ClientKafka,
        private readonly config: ConfigService,
    ) {}

    /**
     * Logic — produce reliability-events; key = clientMessageId.
     * Code — build envelope → kafka.connect → emit(topic, {key, value}).
     * (EN Logic: Produce reliability-events keyed by clientMessageId.)
     * (EN Code: envelope → connect → emit with key/value.)
     */
    async publish(dto: PublishEventDto): Promise<{ status: string; topic: string; key: string }> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        const envelope = {
            clientMessageId: dto.clientMessageId,
            type: dto.type,
            payload: dto.payload ?? {},
            simulateFailure: dto.simulateFailure ?? false,
            timestamp: new Date().toISOString(),
        }
        await this.kafka.connect()
        this.kafka.emit(kafka.topic, { key: dto.clientMessageId, value: envelope })
        this.logger.log(`Produced to ${kafka.topic} key=${dto.clientMessageId}`)
        return { status: "queued", topic: kafka.topic, key: dto.clientMessageId }
    }
}
