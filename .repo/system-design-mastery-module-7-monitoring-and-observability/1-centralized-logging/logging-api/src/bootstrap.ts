/**
 * Khởi tạo Nest app — Winston (Console + Loki), ValidationPipe toàn cục, lắng nghe cổng.
 * (EN: Bootstrap Nest app — Winston (Console + Loki), global ValidationPipe, listen on port.)
 */
import {
    Logger,
    ValidationPipe,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    NestFactory,
} from "@nestjs/core"
import {
    WinstonModule,
} from "nest-winston"
import * as winston from "winston"
import LokiTransport from "winston-loki"
import {
    AppModule,
} from "./app.module"
import type {
    AppConfig,
    LoggingConfig,
} from "./config"

/**
 * Logic — Khởi động Nest app, ValidationPipe, lắng nghe `0.0.0.0` cho Docker.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 * (EN Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.)
 * (EN Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.)
 */
export async function bootstrap(): Promise<void> {
    // Tạo context tạm để đọc config trước khi tạo app chính (cần config cho Winston transports).
    // (EN: Create temp context to read config before creating main app (config needed for Winston transports).)
    const bootstrapApp = await NestFactory.createApplicationContext(AppModule)
    const config = bootstrapApp.get(ConfigService)
    const appRuntime = config.getOrThrow<AppConfig>("app")
    const loggingRuntime = config.getOrThrow<LoggingConfig>("logging")
    await bootstrapApp.close()

    /**
     * Logic — Winston thay logger mặc định NestJS: Console cho dev, Loki cho log tập trung.
     * Code — `WinstonModule.createLogger()` với hai transports; truyền vào `NestFactory.create()`.
     * (EN Logic: Winston replaces default NestJS logger: Console for dev, Loki for centralized logging.)
     * (EN Code: `WinstonModule.createLogger()` with two transports; passed to `NestFactory.create()`.)
     */
    const app = await NestFactory.create(AppModule,
        {
            logger: WinstonModule.createLogger({
                transports: [
                    // Console transport — in log ra stdout (Docker / terminal dev).
                    // (EN: Console transport — prints logs to stdout (Docker / dev terminal).)
                    new winston.transports.Console({
                        format: winston.format.combine(
                            winston.format.timestamp(),
                            winston.format.json(),
                        ),
                    }),
                    // Loki transport — đẩy log qua HTTP push API tới Loki.
                    // (EN: Loki transport — pushes logs via HTTP push API to Loki.)
                    new LokiTransport({
                        host: loggingRuntime.lokiUrl,
                        labels: {
                            app: loggingRuntime.appName,
                            env: loggingRuntime.env,
                        },
                        json: true,
                    }),
                ],
            }),
        })

    // ValidationPipe toàn cục — whitelist strip unknown fields.
    // (EN: Global ValidationPipe — whitelist strips unknown fields.)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false,
    }))

    // Cổng: biến môi trường PORT hoặc 3000; bind 0.0.0.0 cho Docker.
    // (EN: Port from env PORT or default 3000; bind 0.0.0.0 for Docker.)
    await app.listen(
        appRuntime.port,
        "0.0.0.0",
    )
    Logger.log(
        `logging-api listening on :${appRuntime.port} | loki=${loggingRuntime.lokiUrl}`,
        "Bootstrap",
    )
}
