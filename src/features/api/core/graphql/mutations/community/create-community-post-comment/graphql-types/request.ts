import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to create a comment on a community post.",
})
/** Request to create a comment (top-level or reply) on a community post. */
export class CreateCommunityPostCommentRequest {
    /** Post the comment is attached to. */
    @Field(
        () => ID,
        {
            description: "Post the comment is attached to.",
        },
    )
        postId: string

    /** Parent comment id when replying; null/omitted for a top-level comment. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Parent comment id when replying; null for a top-level comment.",
        },
    )
        parentCommentId?: string | null

    /** Raw comment body authored by the user. */
    @Field(
        () => String,
        {
            description: "Raw comment body authored by the user.",
        },
    )
        body: string
}
