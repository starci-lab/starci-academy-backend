import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Result of deleting a content-AI conversation. */
@ObjectType({
    description: "Result of deleting a content-AI conversation.",
})
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
