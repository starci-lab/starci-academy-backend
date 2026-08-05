import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Result of creating a content-AI conversation.",
})
/** Result of creating a content-AI conversation. */
export class CreateContentAiSessionData {
    @Field(
        () => ID,
        {
            nullable: true,
            description: "The new conversation id (null when no enrollment resolves).",
        },
    )
        id: string | null
}

@ObjectType({
    description: "Response wrapper for the createContentAiSession mutation.",
})
/** GraphQL envelope for a new content-AI thread; `data.id` is null when no enrollment resolves so the client can prompt trial/enrol instead of crashing. */
export class CreateContentAiSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CreateContentAiSessionData>
{
    @Field(
        () => CreateContentAiSessionData,
        {
            nullable: true,
            description: "The created conversation.",
        },
    )
        data: CreateContentAiSessionData
}
