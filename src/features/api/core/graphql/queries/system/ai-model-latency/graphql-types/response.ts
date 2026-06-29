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
    AiModelCategory,
    GraphQLTypeAiModelCategory,
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases"

/**
 * Public-safe latency snapshot for one AI model — its identity plus the latest
 * probe outcome. Deliberately carries no raw keys; the per-provider key health
 * stays behind the admin `aiBalancerHealth` query.
 */
@ObjectType({
    description: "Public-safe latency snapshot for one AI model.",
})
export class AiModelLatencyData {
    @Field(
        () => String,
        {
            description: "Concrete model name (e.g. `qwen2.5-coder:7b`).",
        },
    )
        name: string

    @Field(
        () => GraphQLTypeModelProvider,
        {
            description: "Provider that serves the model.",
        },
    )
        provider: ModelProvider

    @Field(
        () => GraphQLTypeAiModelCategory,
        {
            description: "Coarse cost/quality category of the model.",
        },
    )
        category: AiModelCategory

    @Field(
        () => Boolean,
        {
            description: "Whether the latest 1-token probe succeeded.",
        },
    )
        ok: boolean

    @Field(
        () => Int,
        {
            description: "Round-trip latency in ms for the latest probe (0 when it failed).",
        },
    )
        latencyMs: number

    @Field(
        () => Date,
        {
            description: "When the latest probe completed (status-page freshness signal).",
        },
    )
        checkedAt: Date
}

/**
 * Payload of the public `aiModelLatency` query — the latest probe snapshot for
 * every enabled AI model.
 */
@ObjectType({
    description: "Public AI model latency payload.",
})
export class AiModelLatencyResponseData {
    @Field(
        () => [AiModelLatencyData],
        {
            description: "One entry per probed model.",
        },
    )
        models: Array<AiModelLatencyData>
}

@ObjectType({
    description: "Response wrapper for the aiModelLatency query.",
})
export class AiModelLatencyResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AiModelLatencyResponseData>
{
    @Field(
        () => AiModelLatencyResponseData,
        {
            nullable: true,
            description: "Public AI model latency payload.",
        },
    )
        data: AiModelLatencyResponseData
}
