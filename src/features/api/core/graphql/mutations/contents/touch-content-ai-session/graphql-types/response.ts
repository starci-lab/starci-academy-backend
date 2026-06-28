import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Result of touching (re-opening) a content-AI conversation. */
@ObjectType({
    description: "Result of touching a content-AI conversation.",
})
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
