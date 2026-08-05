import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to edit a comment's body.",
})
/** Request to edit a comment's body (author only). */
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
