import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to update a community post comment's body.",
})
/** Request to update a community post comment's body. */
export class UpdateCommunityPostCommentRequest {
    /** Id of the comment to edit. */
    @Field(
        () => ID,
        {
            description: "Id of the comment to edit.",
        },
    )
        commentId: string

    /** New comment body. */
    @Field(
        () => String,
        {
            description: "New comment body.",
        },
    )
        body: string
}
