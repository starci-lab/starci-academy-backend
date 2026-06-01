import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request to edit a comment's body (author only). */
@InputType({
    description: "Request to edit a comment's body.",
})
export class UpdateCommentRequest {
    /** Comment being edited. */
    @Field(
        () => ID,
        {
            description: "Comment being edited.",
        },
    )
        commentId: string

    /** New body to persist. */
    @Field(
        () => String,
        {
            description: "New body to persist.",
        },
    )
        body: string
}
