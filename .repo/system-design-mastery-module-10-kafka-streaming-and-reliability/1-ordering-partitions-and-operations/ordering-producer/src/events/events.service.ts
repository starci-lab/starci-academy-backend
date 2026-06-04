/**
 * Kafka producer service — HTTP emit to `ordering-events` (partitionKey required).
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
 * Class `EventsService` — lesson lab component.
 */
export class EventsService {
    private readonly logger = new Logger(EventsService.name)

    constructor(
        @Inject("KAFKA_PRODUCER") private readonly kafka: ClientKafka,
        private readonly config: ConfigService,
    ) {}

    /**
     * Logic: Same partitionKey lands in one partition → FIFO ordering within partition.
     * Code: emit key = partitionKey; DTO enforces required key.
     */
    async publish(dto: PublishEventDto): Promise<{ status: string; topic: string; key: string }> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        const envelope = {
            type: dto.type,
            payload: dto.payload,
            partitionKey: dto.partitionKey,
            timestamp: new Date().toISOString(),
        }
        await this.kafka.connect()
        this.kafka.emit(kafka.topic,
            {
                key: dto.partitionKey,
                value: envelope,
            })
        this.logger.log(`Produced to ${kafka.topic} key=${dto.partitionKey}`)
        return {
            status: "queued", topic: kafka.topic, key: dto.partitionKey 
        }
    }
}
