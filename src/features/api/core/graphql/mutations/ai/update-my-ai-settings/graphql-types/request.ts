import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    AiMode,
    GraphQLTypeAiMode,
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases"

/**
 * Request for updating the current user's AI lane settings.
 *
 * Supply `byokProvider` + `byokApiKey` together to store a key, or `clearByok`
 * to wipe it. `mode` sets the user's default lane and is validated against the
 * resulting capabilities (after any BYOK change is applied).
 */
@InputType({
    description: "Update the current user's AI lane settings.",
})
export class UpdateMyAiSettingsRequest {
    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "Lane to make the default; omit to leave it unchanged.",
        },
    )
        mode?: AiMode

    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "BYOK provider to store (required with byokApiKey).",
        },
    )
        byokProvider?: ModelProvider

    @Field(
        () => String,
        {
            nullable: true,
            description: "Plaintext BYOK API key to encrypt + store.",
        },
    )
        byokApiKey?: string

    @Field(
        () => Boolean,
        {
            nullable: true,
            description: "When true, wipe any stored BYOK key + provider.",
        },
    )
        clearByok?: boolean
}
