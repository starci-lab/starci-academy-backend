/**
 * Order Service — creates order and emits Kafka event `order-events`.
 */
import {
    Inject,
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    ClientKafka,
} from "@nestjs/microservices"

@Injectable()
/**
 * Class `AppService` — lesson lab component.
 */
export class AppService {
    private readonly logger = new Logger(AppService.name)

    constructor(
        @Inject("KAFKA_SERVICE") private readonly kafkaClient: ClientKafka,
    ) {}

    /**
     * Logic — Generates random order ID, attaches timestamp, emits Kafka event.
     * Code — `kafkaClient.emit('order-events', event)` fires event to topic.
     */
    async createOrder(orderData) {
        const orderId = Math.floor(Math.random() * 100000)
        const event = {
            orderId,
            ...orderData,
            timestamp: new Date().toISOString(),
        }

        this.logger.log(`Creating order ${orderId} and emitting ORDER_CREATED event`)

// Fire-and-forget emit to Kafka topic `order-events`.
        this.kafkaClient.emit("order-events", event)

        return {
            message: "Order Created",
            orderId,
            status: "Pending",
        }
    }
}
