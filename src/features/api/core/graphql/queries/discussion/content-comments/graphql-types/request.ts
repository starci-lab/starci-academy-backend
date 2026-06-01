import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

/** Request for listing comments of a content (top-level, or replies of one parent). */
@InputType({
    description: "Request for listing comments of a content.",
})
export class ContentCommentsRequest {
    /** Content whose comments are listed. */
    @Field(
        () => ID,
        {
            description: "Content whose comments are listed.",
        },
    )
        contentId: string

    /** When set, list replies of this comment; when null, list top-level comments. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Parent comment id to list replies of; null for top-level.",
        },
    )
        parentCommentId?: string | null

    /** 1-based page number (default 1). */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "1-based page number (default 1).",
        },
    )
        page?: number

    /** Page size (default 20). */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Page size (default 20).",
        },
    )
        limit?: number
}
