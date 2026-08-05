import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "@modules/databases"

@InputType({
    description: "Request to set/change/remove a reaction on a comment.",
})
/** Request to set/change/remove the current user's reaction on a comment. */
export class ReactToCommentRequest {
    /** Comment being reacted to. */
    @Field(
        () => ID,
        {
            description: "Comment being reacted to.",
        },
    )
        commentId: string

    /** New emotion, or null to remove the existing reaction. */
    @Field(
        () => GraphQLTypeReactionType,
        {
            nullable: true,
            description: "New emotion, or null to remove the existing reaction.",
        },
    )
        type?: ReactionType | null
}
