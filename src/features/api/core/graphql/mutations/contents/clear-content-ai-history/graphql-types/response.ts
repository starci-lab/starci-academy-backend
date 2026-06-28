import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Result of clearing a content-AI conversation. */
@ObjectType({
    description: "Result of clearing a content-AI conversation.",
})
export class ClearContentAiHistoryData {
    @Field(
        () => Boolean,
        {
            description: "Whether the conversation was cleared.",
        },
    )
        cleared: boolean
}

@ObjectType({
    description: "Response wrapper for the clearContentAiHistory mutation.",
})
export class ClearContentAiHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ClearContentAiHistoryData>
{
    @Field(
        () => ClearContentAiHistoryData,
        {
            nullable: true,
            description: "The clear result.",
        },
    )
        data: ClearContentAiHistoryData
}
