import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Live cAdvisor/Prometheus resource usage of one component's Docker
 * container. Every field is nullable: `null` means "no local container to
 * measure" (Judge0, Ollama, mail, the AI balancer) or "Prometheus has not
 * produced a sample yet" — never a fabricated zero.
 */
@ObjectType({
    description: "Live container resource usage (cAdvisor via Prometheus).",
})
export class ComponentMetricsData {
    @Field(
        () => Float,
        {
            nullable: true,
            description: "CPU usage as a percentage of one core (can exceed 100 on multi-core work).",
        },
    )
        cpuPercent: number | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Resident memory usage in bytes.",
        },
    )
        memoryUsedBytes: number | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Container memory limit in bytes, or null when unbounded.",
        },
    )
        memoryLimitBytes: number | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Network receive throughput in bytes/sec (1m rate).",
        },
    )
        networkRxBytesPerSec: number | null

    @Field(
        () => Float,
        {
            nullable: true,
            description: "Network transmit throughput in bytes/sec (1m rate).",
        },
    )
        networkTxBytesPerSec: number | null
}

/**
 * Public-safe liveness of one infrastructure component. Exposes the
 * traffic-light status, a coarse latency, a short message, and — when the
 * component runs as a local Docker container — its live resource usage. This
 * platform intentionally shows real operational numbers as a "build in
 * public" proof-of-work surface, not a fabricated demo.
 */
@ObjectType({
    description: "Public liveness of one infrastructure component.",
})
export class ComponentHealthData {
    @Field(
        () => String,
        {
            description: "Stable component name, e.g. `postgres`, `redis`, `kafka`.",
        },
    )
        name: string

    @Field(
        () => String,
        {
            description: "Traffic-light status — `up`, `down` or `degraded`.",
        },
    )
        status: string

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Probe round-trip latency in ms, or null when the probe failed.",
        },
    )
        latencyMs: number | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Short note — failure reason when down, else null.",
        },
    )
        message: string | null

    @Field(
        () => Date,
        {
            description: "When the probe completed (status-page freshness signal).",
        },
    )
        checkedAt: Date

    @Field(
        () => ComponentMetricsData,
        {
            nullable: true,
            description: "Live container resource usage, or null when unavailable for this component.",
        },
    )
        metrics: ComponentMetricsData | null
}

/**
 * Payload of the public `systemHealthStatus` query — the liveness of every
 * probed infrastructure component.
 */
@ObjectType({
    description: "Public system health payload.",
})
export class SystemHealthStatusResponseData {
    @Field(
        () => [ComponentHealthData],
        {
            description: "One entry per probed infrastructure component.",
        },
    )
        components: Array<ComponentHealthData>
}

@ObjectType({
    description: "Response wrapper for the systemHealthStatus query.",
})
export class SystemHealthStatusResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SystemHealthStatusResponseData>
{
    @Field(
        () => SystemHealthStatusResponseData,
        {
            nullable: true,
            description: "Public system health payload.",
        },
    )
        data: SystemHealthStatusResponseData
}
