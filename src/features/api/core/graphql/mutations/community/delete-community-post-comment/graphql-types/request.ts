import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to soft-delete a community post comment.",
})
/** Request to soft-delete a community post comment. */
export class DeleteCommunityPostCommentRequest {
    /** Id of the comment to soft-delete. */
    @Field(
        () => ID,
        {
            description: "Id of the comment to soft-delete.",
        },
    )
        commentId: string
}
