import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A content-AI conversation summary.",
})
/** One content-AI conversation in the list / search results. */
export class ContentAiSessionType {
    @Field(
        () => ID,
        {
            description: "Conversation (session) id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Conversation title (null until the first question titles it).",
        },
    )
        title: string | null

    @Field(
        () => Date,
        {
            description: "Last-activity timestamp (recency ordering).",
        },
    )
        updatedAt: Date

    @Field(
        () => Int,
        {
            description: "Number of turns in the conversation.",
        },
    )
        messageCount: number

    @Field(
        () => String,
        {
            description: "Which surface the conversation grounds on: 'content' | 'task' | 'foundation' | 'course'.",
        },
    )
        scope: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Content the conversation is anchored to (content scope only; null for task/foundation/course).",
        },
    )
        originContentId: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Title of the anchoring content (search results only).",
        },
    )
        originContentTitle: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "First matching message (search results only).",
        },
    )
        snippet: string | null
}

@ObjectType({
    description: "A list of content-AI conversations.",
})
/** The current user's content-AI conversations (recency-first). */
export class ContentAiSessionsData {
    @Field(
        () => [ContentAiSessionType],
        {
            description: "The conversations, recency-first.",
        },
    )
        sessions: Array<ContentAiSessionType>
}

@ObjectType({
    description: "Response wrapper for the contentAiSessions query.",
})
/**
 * Envelope for `contentAiSessions` — status metadata plus the conversation
 * list (null when the transform interceptor wraps a failure).
 */
export class ContentAiSessionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ContentAiSessionsData>
{
    @Field(
        () => ContentAiSessionsData,
        {
            nullable: true,
            description: "The conversations.",
        },
    )
        data: ContentAiSessionsData
}
