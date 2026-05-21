/**
 * Service lesson — methods documented Logic + Code (§4).
 * (EN: Lesson service — Logic + Code on methods (§4).)
 */
import {
    ConfigService,
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    Logger,
} from "@nestjs/common"
import Redis from "ioredis"
import {
    ConfigService,
} from "@nestjs/config"

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class KafkaProducerService {
    private readonly logger = new Logger(KafkaProducerService.name)

/**
 * Logic — Khởi tạo client/hook khi module sẵn sàng (Redis/Kafka/DB pool).
 * Code — Hook `OnModuleInit`: đọc `ConfigService` và tạo connection/client.
 * (EN Logic: Initialize clients when the module becomes ready.)
 * (EN Code: `OnModuleInit` hook: read `ConfigService` and open connections.)
 */
    async onModuleInit() {
        await this.client.connect()
    }

    /**
 * Logic — Ghi/sự kiện mới qua `emit`.
 * Code — Validate input → mutate state / emit message → return summary.
 * (EN Logic: Write/event via `emit`.)
 * (EN Code: Validate → mutate state / emit → return summary.)
 */
    emit(event: SagaEvent) {
        this.log.log(`Publishing event "${event.event}" for order "${event.orderId}"`)
        return this.client.emit(TOPIC,
            event)
    }
}
