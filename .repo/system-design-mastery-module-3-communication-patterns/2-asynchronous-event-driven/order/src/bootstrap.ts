/**
 * Bootstrap Order Producer Nest app — REST API for POST /orders, emits Kafka event.
 */
import {
    ValidationPipe,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    NestFactory,
} from "@nestjs/core"
import {
    AppModule,
} from "./app.module"

/**
 * Logic — Start Nest app with global ValidationPipe and Docker-friendly bind.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidUnknownValues: false,
        }),
    )
// Port from ConfigService app.port (via app.config.ts).
    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    await app.listen(
        port,
// Listen on all interfaces so Docker port mapping works.
        "0.0.0.0",
    )
}
