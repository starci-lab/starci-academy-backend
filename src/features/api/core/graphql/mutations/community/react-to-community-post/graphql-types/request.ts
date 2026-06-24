import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "@modules/databases"

/** Request to set/change/remove a reaction on a community post. */
@InputType({
    description: "Request to set/change/remove a reaction on a community post.",
})
export class ReactToCommunityPostRequest {
    /** Post being reacted to. */
    @Field(
        () => ID,
        {
            description: "Post being reacted to.",
        },
    )
        postId: string

    /** Emotion to set; null/omitted removes the viewer's reaction. */
    @Field(
        () => GraphQLTypeReactionType,
        {
            nullable: true,
            description: "Emotion to set; null removes the viewer's reaction.",
        },
    )
        type?: ReactionType | null
}
