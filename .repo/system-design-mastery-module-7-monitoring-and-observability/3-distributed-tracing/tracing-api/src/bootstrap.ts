/**
 * Khởi động OpenTelemetry SDK (export OTLP HTTP sang Jaeger) rồi Nest tracing-api — ngữ cảnh trace hoạt động cho HTTP + span con trong service.
 * (EN: Start OpenTelemetry SDK (OTLP HTTP export to Jaeger) then Nest tracing-api — trace context spans HTTP plus child spans in services.)
 */
import {
    getNodeAutoInstrumentations,
} from "@opentelemetry/auto-instrumentations-node"
import {
    OTLPTraceExporter,
} from "@opentelemetry/exporter-trace-otlp-http"
import {
    Resource,
} from "@opentelemetry/resources"
import {
    NodeSDK,
} from "@opentelemetry/sdk-node"
import {
    SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions"
import {
    NestFactory,
} from "@nestjs/core"
import {
    AppModule,
} from "./app.module"

/**
 * Logic — Khởi động Nest app, ValidationPipe, lắng nghe `0.0.0.0` cho Docker.
 * Code — `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
 * (EN Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.)
 * (EN Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.)
 */
export async function bootstrap(): Promise<void> {
    const sdk = new NodeSDK({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: "nestjs-tracing-app",
        }),
        traceExporter: new OTLPTraceExporter({
            url:
                process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
                ?? "http://localhost:4318/v1/traces",
        }),
        instrumentations: [getNodeAutoInstrumentations()],
    })
    await sdk.start()

    const app = await NestFactory.create(AppModule)
    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    // Cổng lắng nghe: env PORT hoặc 3000 (map host trong Compose nhánh tracing-api).
    // (EN: Listen port from env PORT or 3000 (host mapping via Compose tracing-api service).)
    await app.listen(
        port,
        // Lắng nghe trên mọi interface để Docker map được cổng.
        // (EN: Listen on all interfaces so Docker port mapping works.)
        "0.0.0.0",
    )
}
