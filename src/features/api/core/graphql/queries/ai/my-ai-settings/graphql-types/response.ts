import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    AiMode,
    AiSubTier,
    GraphQLTypeAiMode,
    GraphQLTypeAiSubTier,
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases"

/**
 * The authenticated user's AI lane settings + the capabilities the UI needs
 * to decide which lanes are selectable. The raw BYOK key is never exposed —
 * only whether one is on file.
 */
@ObjectType({
    description: "Per-user AI lane settings (preference + capabilities).",
})
export class MyAiSettingsResponseData {
    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "Lane the user chose by default; null = natural order.",
        },
    )
        preferredMode: AiMode | null

    @Field(
        () => GraphQLTypeAiMode,
        {
            description: "Lane the user actually runs on now (preference validated).",
        },
    )
        effectiveMode: AiMode

    @Field(
        () => Boolean,
        {
            description: "Whether the paid Premium lane is currently usable.",
        },
    )
        canPremium: boolean

    @Field(
        () => Boolean,
        {
            description: "Whether a BYOK key is on file (byok lane selectable).",
        },
    )
        canByok: boolean

    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider of the BYOK key on file, or null when none.",
        },
    )
        byokProvider: ModelProvider | null

    @Field(
        () => Boolean,
        {
            description: "Whether an encrypted BYOK key is stored.",
        },
    )
        hasByokKey: boolean

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
