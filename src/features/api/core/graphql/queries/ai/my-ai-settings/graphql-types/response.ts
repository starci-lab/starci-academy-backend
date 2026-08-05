import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    AiSubTier,
    GraphQLTypeAiSubTier,
} from "@modules/databases"

@ObjectType({
    description: "Per-user AI capabilities (unlock + active tier).",
})
/**
 * The authenticated user's AI capabilities the UI needs to decide which models
 * are selectable (unlock + active tier).
 */
export class MyAiSettingsResponseData {
    @Field(
        () => Boolean,
        {
            description: "Whether the user may use paid-tier models (paid OR enrolled).",
        },
    )
        canPremium: boolean

    @Field(
        () => GraphQLTypeAiSubTier,
        {
            nullable: true,
            description: "Active paid tier, or null on the free lane.",
        },
    )
        tier: AiSubTier | null
}

@ObjectType({
    description: "Response wrapper for the myAiSettings query.",
})
/**
 * GraphQL envelope for `myAiSettings`. `data` is null only on the error path;
 * free users still return `{ canPremium, tier: null }` so the settings UI
 * can render without a separate "are they paid?" query.
 */
export class MyAiSettingsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyAiSettingsResponseData>
{
    @Field(
        () => MyAiSettingsResponseData,
        {
            nullable: true,
            description: "Per-user AI lane settings payload.",
        },
    )
        data: MyAiSettingsResponseData
}
