import {
    Field,
    ID,
    Int,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for {@link ContentAiSessionsResponse}: list the current user's
 * content-AI conversations for a content, OR — when `search` is given — search
 * ALL their conversations in the content's course (title + message text).
 */
@InputType({
    description: "List or search the current user's content-AI conversations for a scope.",
})
export class ContentAiSessionsRequest {
    @Field(
        () => String,
        {
            nullable: true,
            description: "Which surface to list: 'content' | 'task' | 'foundation' | 'course'. Omitted → derived from whichever anchor id is present (priority content > task > foundation > course).",
        },
    )
        scope?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Current content (content scope) — anchors the list / scopes search to its course.",
        },
    )
        contentId?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Current capstone / personal-project task (task scope).",
        },
    )
        taskId?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Current hands-on challenge (challenge scope).",
        },
    )
        challengeId?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Current global foundation-library doc (foundation scope).",
        },
    )
        foundationId?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Current course (course scope) — lists the whole-course conversations.",
        },
    )
        courseId?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "When set, search ALL conversations in the course by title + message text.",
        },
    )
        search?: string

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Page size (recency-first). Defaults to 20.",
        },
    )
        limit?: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Rows to skip for pagination. Defaults to 0.",
        },
    )
        offset?: number

    @Field(
        () => Boolean,
        {
            nullable: true,
            description: "Include archived conversations in the list. Defaults to false. (Ignored when searching — search always spans archived.)",
        },
    )
        includeArchived?: boolean
}
