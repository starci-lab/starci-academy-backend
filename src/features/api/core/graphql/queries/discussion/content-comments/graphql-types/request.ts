import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Request for listing comments of a content or a course-general question.",
})
/**
 * Request for listing comments — top-level of a lesson/course scope, or replies of one
 * parent. A top-level listing (`parentCommentId` omitted) must set exactly one of
 * `contentId`/`courseId`; a reply listing only needs `parentCommentId`.
 */
export class ContentCommentsRequest {
    /** Content whose top-level comments are listed; omit for a course-general scope or a reply listing. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Content whose top-level comments are listed; omit for a course-general scope or a reply listing.",
        },
    )
        contentId?: string | null

    /** Course whose top-level (course-general) comments are listed; omit for a lesson scope or a reply listing. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Course whose top-level (course-general) comments are listed; omit for a lesson scope or a reply listing.",
        },
    )
        courseId?: string | null

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
