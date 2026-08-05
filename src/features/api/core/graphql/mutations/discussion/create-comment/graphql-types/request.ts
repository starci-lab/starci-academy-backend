import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to create a comment on a content or a course-general question.",
})
/**
 * Request to create a comment (top-level or reply). A top-level comment must set
 * exactly one of `contentId` (a lesson question) or `courseId` (a course-general
 * "hỏi chung khóa" question); a reply only needs `parentCommentId` — it inherits its
 * scope from the parent, so both scope fields may be omitted.
 */
export class CreateCommentRequest {
    /** Content the comment is attached to; omit for a course-general question or a reply. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Content the comment is attached to; omit for a course-general question or a reply.",
        },
    )
        contentId?: string | null

    /** Course the comment is attached to (course-general question); omit for a lesson question or a reply. */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Course the comment is attached to (course-general question); omit for a lesson question or a reply.",
        },
    )
        courseId?: string | null

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
