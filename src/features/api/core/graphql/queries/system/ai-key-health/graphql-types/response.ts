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

/**
 * Public-safe view of one key: a masked label (`abc...def`) and a single
 * healthy flag. Deliberately omits the raw value, fail counts, cooldown and
 * disabled timestamps — those are operational intel kept behind the admin
 * `aiBalancerHealth` query.
 */
@ObjectType({
    description: "Public-safe health of one key — masked label + healthy flag.",
})
export class PublicKeyHealthData {
    @Field(
        () => String,
        {
            description: "Masked key label, `abc...def` (raw value never exposed).",
        },
    )
        keyMask: string

    @Field(
        () => Boolean,
        {
            description: "Whether the key is healthy right now.",
        },
    )
        healthy: boolean
}

/**
 * Health of the keys behind one model (its `.key` file), masked for a public
 * "build in public" status page.
 */
@ObjectType({
    description: "Public key health for one model.",
})
export class AiKeyHealthGroupData {
    @Field(
        () => GraphQLTypeModelProvider,
        {
            description: "Provider that serves these keys.",
        },
    )
        provider: ModelProvider

    @Field(
        () => [String],
        {
            description: "Models that run on this key set.",
        },
    )
        models: Array<string>

    @Field(
        () => Int,
        {
            description: "Total keys behind this model.",
        },
    )
        totalKeys: number

    @Field(
        () => Int,
        {
            description: "How many of those keys are healthy right now.",
        },
    )
        healthyKeys: number

    @Field(
        () => [PublicKeyHealthData],
        {
            description: "Per-key masked health.",
        },
    )
        keys: Array<PublicKeyHealthData>
}

@ObjectType({
    description: "Public AI key health payload.",
})
export class AiKeyHealthResponseData {
    @Field(
        () => [AiKeyHealthGroupData],
        {
            description: "One group per model.",
        },
    )
        groups: Array<AiKeyHealthGroupData>
}

@ObjectType({
    description: "Response wrapper for the aiKeyHealth query.",
})
export class AiKeyHealthResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AiKeyHealthResponseData>
{
    @Field(
        () => AiKeyHealthResponseData,
        {
            nullable: true,
            description: "Public AI key health payload.",
        },
    )
        data: AiKeyHealthResponseData
}
