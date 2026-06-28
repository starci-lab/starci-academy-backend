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

/** One content-AI conversation in the list / search results. */
@ObjectType({
    description: "A content-AI conversation summary.",
})
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
        () => ID,
        {
            description: "Content the conversation is anchored to.",
        },
    )
        originContentId: string

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

/** The current user's content-AI conversations (recency-first). */
@ObjectType({
    description: "A list of content-AI conversations.",
})
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
