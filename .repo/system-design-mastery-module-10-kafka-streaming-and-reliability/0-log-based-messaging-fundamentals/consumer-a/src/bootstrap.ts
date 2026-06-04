/**
 * Bootstrap Nest Kafka microservice — consumer group from ConfigService.
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    ConfigService,
} from "@nestjs/config"
import {
    MicroserviceOptions,
    Transport,
} from "@nestjs/microservices"
import {
    AppModule,
} from "./app.module"
import type {
    KafkaConfig,
} from "./config"

/**
 * Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.
 * Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 */
export async function bootstrap(): Promise<void> {
    const ctx = await NestFactory.createApplicationContext(AppModule)
    const kafka = ctx.get(ConfigService).getOrThrow<KafkaConfig>("kafka")
    await ctx.close()

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: kafka.clientId,
                brokers: kafka.brokers,
            },
            consumer: {
                groupId: kafka.groupId,
            },
        },
    })
    await app.listen()
}
