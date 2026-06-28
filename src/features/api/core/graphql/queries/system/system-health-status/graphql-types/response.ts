import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Public-safe liveness of one infrastructure component. Exposes only the
 * traffic-light status, a coarse latency and a short message — enough to render
 * a "build in public" status page without leaking operational internals.
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
