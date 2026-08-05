import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases"

@ObjectType({
    description: "Health info for one API key in the balancer pool.",
})
/**
 * GraphQL surface of one API key -- `value` is intentionally absent; only the
 * 4-char suffix leaves the server boundary.
 */
export class AiBalancerKeyHealthData {
    @Field(
        () => GraphQLTypeModelProvider,
        {
            description: "Provider this key belongs to.",
        },
    )
        provider: ModelProvider

    @Field(
        () => String,
        {
            description: "Last 4 chars of the key value (key never leaves the server).",
        },
    )
        keySuffix: string

    @Field(
        () => String,
        {
            description: "Lifecycle status — active / disabled / probing.",
        },
    )
        status: string

    @Field(
        () => Int,
        {
            description: "Consecutive failures since the last success.",
        },
    )
        failCount: number

    @Field(
        () => Date,
        {
            nullable: true,
            description: "Wall-clock timestamp of the last attempted use (success or failure).",
        },
    )
        lastUsedAt: Date | null

    @Field(
        () => Date,
        {
            nullable: true,
            description: "Wall-clock timestamp of the last health-check ping.",
        },
    )
        lastHealthCheckAt: Date | null

    @Field(
        () => Date,
        {
            nullable: true,
            description: "Wall-clock timestamp the key was disabled (null when active).",
        },
    )
        disabledAt: Date | null
}

@ObjectType({
    description: "Aggregate health snapshot for one provider's key pool.",
})
/**
 * Roll-up of one provider's key pool -- totals plus per-key rows -- so an admin
 * can see at a glance whether rotation still has healthy keys left.
 */
export class AiBalancerProviderHealthData {
    @Field(
        () => GraphQLTypeModelProvider,
        {
            description: "Provider.",
        },
    )
        provider: ModelProvider

    @Field(
        () => String,
        {
            description: "Mount path of the file backing this provider's pool.",
        },
    )
        keysFilePath: string

    @Field(
        () => Int,
        {
            description: "Total keys loaded for this provider (any status).",
        },
    )
        totalKeys: number

    @Field(
        () => Int,
        {
            description: "Keys currently eligible for rotation.",
        },
    )
        activeKeys: number

    @Field(
        () => Int,
        {
            description: "Keys currently disabled after exceeding failure threshold.",
        },
    )
        disabledKeys: number

    @Field(
        () => [AiBalancerKeyHealthData],
        {
            description: "Per-key health entries.",
        },
    )
        keys: Array<AiBalancerKeyHealthData>
}

@ObjectType({
    description: "AI Balancer health snapshot payload.",
})
/** Admin-only payload: every provider pool the balancer currently mounts. */
export class AiBalancerHealthResponseData {
    @Field(
        () => [AiBalancerProviderHealthData],
        {
            description: "Per-provider health summaries.",
        },
    )
        providers: Array<AiBalancerProviderHealthData>
}

@ObjectType({
    description: "Response wrapper for the aiBalancerHealth query.",
})
/** GraphQL envelope for the admin `aiBalancerHealth` query. */
export class AiBalancerHealthResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AiBalancerHealthResponseData>
{
    @Field(
        () => AiBalancerHealthResponseData,
        {
            nullable: true,
            description: "AI Balancer health snapshot payload.",
        },
    )
        data: AiBalancerHealthResponseData
}
