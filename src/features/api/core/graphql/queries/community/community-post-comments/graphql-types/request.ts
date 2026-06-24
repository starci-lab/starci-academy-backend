import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

/** Request to list a community post's comments (top-level or one parent's replies). */
@InputType({
    description: "Request to list a community post's comments.",
})
export class CommunityPostCommentsRequest {
    /** Post whose comments are listed. */
    @Field(
        () => ID,
        {
            description: "Post whose comments are listed.",
        },
    )
        postId: string

    /** Parent comment id to list its replies; omit for top-level comments. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Parent comment id to list its replies; omit for top-level comments.",
        },
    )
        parentCommentId?: string | null

    /** 1-based page number. */
    @Field(
        () => Int,
        {
            defaultValue: 1,
            description: "1-based page number.",
        },
    )
        page?: number

    /** Page size. */
    @Field(
        () => Int,
        {
            defaultValue: 20,
            description: "Page size.",
        },
    )
        limit?: number
}
