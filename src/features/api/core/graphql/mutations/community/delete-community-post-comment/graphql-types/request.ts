import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request to soft-delete a community post comment. */
@InputType({
    description: "Request to soft-delete a community post comment.",
})
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
