import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "@modules/databases/postgresql/primary/enums/reaction-type"

@InputType({
    description: "Request to set/change/remove a reaction on a community post comment.",
})
/** Request to set/change/remove a reaction on a community post comment. */
export class ReactToCommunityPostCommentRequest {
    /** Comment being reacted to. */
    @Field(
        () => ID,
        {
            description: "Comment being reacted to.",
        },
    )
        commentId: string

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
