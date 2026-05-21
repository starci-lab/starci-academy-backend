/**
 * Khởi động Nest API proxy Consul và lắng nghe cổng 3000 (lab).
 * (EN: Start Nest Consul proxy API and listen on port 3000 (lab).)
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    AppModule,
} from "./app.module"
import {
    ConfigService,
} from "@nestjs/config"
import type {
    AppConfig,
} from "./config"

/**
 * Logic — Khởi động Nest app, ValidationPipe, lắng nghe `0.0.0.0` cho Docker.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 * (EN Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.)
 * (EN Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    const config = app.get(ConfigService)
    const appRuntime = config.getOrThrow<AppConfig>("app")
    await app.listen(
        appRuntime.port,
        "0.0.0.0",
    )
}
