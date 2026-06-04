/**
 * Bootstrap NATS Analytics Microservice — listens on `app.events`.
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
        transport: Transport.NATS,
        options: {
            servers: [
// NATS server address from env or default.
                process.env.NATS_URL || "nats://nats:4222",
            ],
        },
    })
    await app.listen()
}
