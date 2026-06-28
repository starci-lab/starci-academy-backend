import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Result of creating a content-AI conversation. */
@ObjectType({
    description: "Result of creating a content-AI conversation.",
})
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
