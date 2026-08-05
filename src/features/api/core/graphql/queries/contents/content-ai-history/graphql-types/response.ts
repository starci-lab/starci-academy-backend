import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "One saved turn in a content-AI conversation.",
})
/** One saved turn in a content-AI conversation. */
export class ContentAiHistoryTurnType {
    @Field(
        () => String,
        {
            description: "Who sent it: 'user' or 'assistant'.",
        },
    )
        role: string

    @Field(
        () => String,
        {
            description: "The message text (assistant content may be markdown).",
        },
    )
        content: string
}

@ObjectType({
    description: "A content-AI saved conversation.",
})
/** The saved content-AI conversation for a content (oldest first). */
export class ContentAiHistoryData {
    @Field(
        () => [ContentAiHistoryTurnType],
        {
            description: "The saved turns, oldest first.",
        },
    )
        messages: Array<ContentAiHistoryTurnType>
}

@ObjectType({
    description: "Response wrapper for the contentAiHistory query.",
})
/**
 * Envelope for `contentAiSessionMessages` -- status metadata plus the saved
 * turns payload (null when the transform interceptor wraps a failure).
 */
export class ContentAiHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ContentAiHistoryData>
{
    @Field(
        () => ContentAiHistoryData,
        {
            nullable: true,
            description: "The saved conversation.",
        },
    )
        data: ContentAiHistoryData
}
