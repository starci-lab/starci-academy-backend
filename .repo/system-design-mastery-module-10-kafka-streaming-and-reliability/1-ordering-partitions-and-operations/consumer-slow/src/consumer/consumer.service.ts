/**
 * Lesson service — Kafka consumer processes topic messages.
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import type {
    KafkaConfig,
} from "../config"

/**
 * Class `ConsumerService` — consumer group member.
 * (EN: Class `ConsumerService` — consumer group member.)
 */
@Injectable()
export class ConsumerService {
    private readonly logger = new Logger(ConsumerService.name)
    private processed = 0

    constructor(private readonly config: ConfigService) {}

    /**
     * Logic: Log consumed message; optional delay for lag demo.
     * Code: `getOrThrow('kafka')` → optional sleep → increment → log.
     */
    async process(data: Record<string, string | number | boolean>): Promise<void> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        // Code — setTimeout promise khi consumerDelayMs > 0.
        // (EN Logic: Slow consumer uses CONSUMER_DELAY_MS sleep.)
        // (EN Code: await setTimeout when consumerDelayMs > 0.)
        if (kafka.consumerDelayMs > 0) {
            await new Promise((r) => setTimeout(r, kafka.consumerDelayMs))
        }
        this.processed += 1
        this.logger.log(
            `[${kafka.clientId ?? "consumer-slow"}] #${this.processed} partitionKey=${String(data.partitionKey ?? "?")} type=${String(data.type ?? "?")}`,
        )
    }
}
