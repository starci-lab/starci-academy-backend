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
    description: "List or search the current user's content-AI conversations.",
})
export class ContentAiSessionsRequest {
    @Field(
        () => ID,
        {
            description: "Current content (anchors the list / scopes search to its course).",
        },
    )
        contentId: string

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
