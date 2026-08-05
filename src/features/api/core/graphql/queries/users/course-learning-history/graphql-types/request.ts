import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Cursor-paginated request for the viewer's per-course learning history.",
})
/**
 * Cursor-paginated request for the current user's learning history within a
 * single course. The course is addressed by its opaque relay global id (decoded
 * server-side with `fromGlobalId`), matching how other course-scoped queries
 * accept a course reference.
 */
export class CourseLearningHistoryRequest {
    @Field(
        () => ID,
        {
            description: "Opaque course global id (relay-style) to fetch the viewer's history for.",
        },
    )
        courseId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor from the previous page's nextCursor; omit for page 1.",
        },
    )
        cursor?: string

    @Field(
        () => Int,
        {
            defaultValue: 20,
            description: "Max items per page.",
        },
    )
        limit?: number
}
