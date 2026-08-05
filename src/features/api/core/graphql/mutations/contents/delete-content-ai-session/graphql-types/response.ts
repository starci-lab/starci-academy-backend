import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Result of deleting a content-AI conversation.",
})
/** Result of deleting a content-AI conversation. */
export class DeleteContentAiSessionData {
    @Field(
        () => Boolean,
        {
            description: "Whether the conversation was deleted.",
        },
    )
        cleared: boolean
}

@ObjectType({
    description: "Response wrapper for the deleteContentAiSession mutation.",
})
/** GraphQL envelope confirming a conversation was removed so leftover session rows do not keep appearing in the sidebar. */
export class DeleteContentAiSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<DeleteContentAiSessionData>
{
    @Field(
        () => DeleteContentAiSessionData,
        {
            nullable: true,
            description: "The deletion result.",
        },
    )
        data: DeleteContentAiSessionData
}
