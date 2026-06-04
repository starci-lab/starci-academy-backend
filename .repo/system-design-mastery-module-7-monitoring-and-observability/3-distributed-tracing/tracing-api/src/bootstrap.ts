/**
 * Start OpenTelemetry SDK (OTLP HTTP export to Jaeger) then Nest tracing-api — trace context spans HTTP plus child spans in services.
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
    ConfigService,
} from "@nestjs/config"
import {
    AppModule,
} from "./app.module"

/**
 * Logic: Start Nest app with global ValidationPipe and Docker-friendly bind.
 * Code: `NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `app.listen(port, '0.0.0.0')`.
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
    // Listen port from env PORT or 3000 (host mapping via Compose tracing-api service).
    await app.listen(
        port,
        // Listen on all interfaces so Docker port mapping works.
        "0.0.0.0",
    )
}
