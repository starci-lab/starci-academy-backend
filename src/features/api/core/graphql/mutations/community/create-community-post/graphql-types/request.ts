import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    CommunityChannel,
    GraphQLTypeCommunityChannel,
} from "@modules/databases/postgresql/primary/enums/community-channel"

@InputType({
    description: "Request to create a community post.",
})
/** Request to create a community post. */
export class CreateCommunityPostRequest {
    /** Channel the post is published to (defaults to the general channel). */
    @Field(
        () => GraphQLTypeCommunityChannel,
        {
            nullable: true,
            defaultValue: CommunityChannel.General,
            description: "Channel the post is published to.",
        },
    )
        channel?: CommunityChannel

    /** Raw markdown/plain body authored by the user. */
    @Field(
        () => String,
        {
            description: "Raw markdown/plain body authored by the user.",
        },
    )
        body: string
}
