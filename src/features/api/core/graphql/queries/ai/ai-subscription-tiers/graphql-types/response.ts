import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "One AI subscription tier (price + additive credits).",
})
/** One purchasable AI subscription tier from the mounted catalog. */
export class AiSubscriptionTierData {
    @Field(
        () => String,
        {
            description: "Stable tier id (plus / pro / max).",
        },
    )
        tier: string

    @Field(
        () => String,
        {
            description: "UI label for the tier.",
        },
    )
        displayName: string

    @Field(
        () => String,
        {
            description: "Short audience/purpose tagline shown on the tier card.",
        },
    )
        description: string

    @Field(
        () => Int,
        {
            description: "Monthly price in VND.",
        },
    )
        priceVnd: number

    @Field(
        () => Float,
        {
            description: "Monthly price in USD (dollars) for international gateways.",
        },
    )
        priceUsd: number

    @Field(
        () => Int,
        {
            description: "Additive credits per 5-hour rolling window.",
        },
    )
        creditsPer5h: number

    @Field(
        () => Int,
        {
            description: "Additive credits per weekly rolling window.",
        },
    )
        creditsPerWeek: number

    @Field(
        () => Boolean,
        {
            description: "Whether to highlight this tier as most popular.",
        },
    )
        popular: boolean
}

@ObjectType({
    description: "Purchasable AI subscription tiers.",
})
/** Catalog of purchasable AI subscription tiers. */
export class AiSubscriptionTiersResponseData {
    @Field(
        () => [AiSubscriptionTierData],
        {
            description: "Enabled tiers, in catalog order.",
        },
    )
        tiers: Array<AiSubscriptionTierData>
}

@ObjectType({
    description: "Response wrapper for the aiSubscriptionTiers query.",
})
/**
 * GraphQL envelope for `aiSubscriptionTiers`. `data` is null only on the
 * error path; an empty catalog still returns `{ tiers: [] }` inside `data`.
 */
export class AiSubscriptionTiersResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AiSubscriptionTiersResponseData>
{
    @Field(
        () => AiSubscriptionTiersResponseData,
        {
            nullable: true,
            description: "AI subscription tier catalog payload.",
        },
    )
        data: AiSubscriptionTiersResponseData
}
