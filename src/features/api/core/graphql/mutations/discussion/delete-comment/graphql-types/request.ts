import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request to soft-delete a comment (author only). */
@InputType({
    description: "Request to soft-delete a comment.",
})
export class DeleteCommentRequest {
    /** Comment being deleted. */
    @Field(
        () => ID,
        {
            description: "Comment being deleted.",
        },
    )
        commentId: string
}
