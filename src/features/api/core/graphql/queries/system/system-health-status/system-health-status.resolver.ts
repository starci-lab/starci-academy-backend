import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    SystemHealthService,
} from "@modules/health"
import {
    SystemHealthStatusResponse,
    SystemHealthStatusResponseData,
} from "./graphql-types"

@Resolver()
/**
 * PUBLIC "build in public" system health — the live liveness of every
 * infrastructure component (Postgres, Redis, NATS, Kafka, MinIO, Qdrant,
 * Elasticsearch, Keycloak, Judge0, Ollama), plus live CPU/memory/network
 * usage for the ones running as local Docker containers (cAdvisor via
 * Prometheus). No guard: intentionally public — real numbers, not a demo.
 * Operational internals that would actually help an attacker (fail counts,
 * cooldowns, credentials) stay behind the admin queries.
 */
export class SystemHealthStatusResolver {
    constructor(
        private readonly systemHealthService: SystemHealthService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "System health fetched successfully",
        [Locale.Vi]: "Lấy trạng thái hệ thống thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => SystemHealthStatusResponse,
        {
            name: "systemHealthStatus",
            description:
                "Public system health — per-component liveness (status, latency, message) "
                + "plus live CPU/memory/network usage where available. No guard.",
        },
    )
    async execute(): Promise<SystemHealthStatusResponseData> {
        // probe (or serve the cached sweep of) every infrastructure component
        const components = await this.systemHealthService.probeAll()
        // map each internal probe result onto the public-safe GraphQL shape
        return {
            components: components.map((component) => ({
                name: component.name,
                status: component.status,
                latencyMs: component.latencyMs,
                message: component.message,
                checkedAt: component.checkedAt,
                metrics: component.metrics,
            })),
        }
    }
}
