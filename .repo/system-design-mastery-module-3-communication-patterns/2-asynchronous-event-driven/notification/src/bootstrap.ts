/**
 * Bootstrap Kafka Notification Microservice — consumer group `notification-consumer`.
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    MicroserviceOptions,
    Transport,
} from "@nestjs/microservices"
import {
    AppModule,
} from "./app.module"

/**
 * Logic — Start Nest app with global ValidationPipe and Docker-friendly bind.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.KAFKA,
        options: {
            client: {
// Kafka broker address from env or default.
                brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
            },
            consumer: {
// Unique group ID for Notification consumer.
                groupId: "notification-consumer",
            },
        },
    })
    await app.listen()
}
