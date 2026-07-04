import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    AiMode,
    GraphQLTypeAiMode,
} from "@modules/databases"

/**
 * Request for updating the current user's AI lane settings.
 *
 * `mode` sets the user's default lane and is validated against the user's
 * capabilities.
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
}
