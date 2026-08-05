import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to soft-delete a comment.",
})
/** Request to soft-delete a comment (author only). */
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
