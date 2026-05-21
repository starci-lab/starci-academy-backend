/**
 * Kafka producer service — HTTP nhận event và `emit` lên topic `platform-events`.
 * (EN: Kafka producer service — accepts HTTP events and `emit`s to `platform-events` topic.)
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
/**
 * Class `EventsService` — thành phần lab (controller/service/module).
 * (EN: Class `EventsService` — lesson lab component.)
 */
export class EventsService {
    private readonly logger = new Logger(EventsService.name)

    constructor(
        @Inject("KAFKA_PRODUCER") private readonly kafka: ClientKafka,
        private readonly config: ConfigService,
    ) {}

    /**
     * Logic — ghi event vào log Kafka; partitionKey quyết định partition (mặc định "default").
     * Code — connect producer, emit(topic, { key, value }), trả queued + topic + key.
     * (EN Logic: Append event to Kafka log; partitionKey selects partition (default "default").)
     * (EN Code: connect producer, emit(topic, { key, value }), return queued metadata.)
     */
    async publish(dto: PublishEventDto): Promise<{ status: string; topic: string; key: string }> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        const partitionKey = dto.partitionKey ?? "default"
        const envelope = {
            type: dto.type,
            payload: dto.payload,
            partitionKey,
            timestamp: new Date().toISOString(),
        }
        await this.kafka.connect()
        this.kafka.emit(kafka.topic, {
            key: partitionKey,
            value: envelope,
        })
        this.logger.log(`Produced to ${kafka.topic} key=${partitionKey}`)
        return { status: "queued", topic: kafka.topic, key: partitionKey }
    }
}
