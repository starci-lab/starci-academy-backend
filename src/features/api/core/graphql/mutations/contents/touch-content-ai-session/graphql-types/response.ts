import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Result of touching a content-AI conversation.",
})
/** Result of touching (re-opening) a content-AI conversation. */
export class TouchContentAiSessionData {
    @Field(
        () => Boolean,
        {
            description: "Whether the conversation's recency was bumped.",
        },
    )
        touched: boolean
}

@ObjectType({
    description: "Response wrapper for the touchContentAiSession mutation.",
})
/** GraphQL envelope confirming recency was bumped so reload auto-reopens this conversation, not an older one. */
export class TouchContentAiSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<TouchContentAiSessionData>
{
    @Field(
        () => TouchContentAiSessionData,
        {
            nullable: true,
            description: "The touch result.",
        },
    )
        data: TouchContentAiSessionData
}
