/**
 * Bootstrap Nest app — Winston (Console + Loki), global ValidationPipe, listen on port.
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
 * Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.
 * Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 */
export async function bootstrap(): Promise<void> {
    // Create temp context to read config before creating main app (config needed for Winston transports).
    const bootstrapApp = await NestFactory.createApplicationContext(AppModule)
    const config = bootstrapApp.get(ConfigService)
    const appRuntime = config.getOrThrow<AppConfig>("app")
    const loggingRuntime = config.getOrThrow<LoggingConfig>("logging")
    await bootstrapApp.close()

    /**
     * Logic: Winston replaces default NestJS logger: Console for dev, Loki for centralized logging.
     * Code: `WinstonModule.createLogger()` with two transports; passed to `NestFactory.create()`.
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
                    // Loki transport — pushes logs via HTTP push API to Loki.
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

    // Global ValidationPipe — whitelist strips unknown fields.
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false,
    }))

    // Port from env PORT or default 3000; bind 0.0.0.0 for Docker.
    await app.listen(
        appRuntime.port,
        "0.0.0.0",
    )
    Logger.log(
        `logging-api listening on :${appRuntime.port} | loki=${loggingRuntime.lokiUrl}`,
        "Bootstrap",
    )
}
