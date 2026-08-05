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
    description: "Answer to a content question from StarCi AI.",
})
/** The AI answer to one content question. */
export class AskContentAiData {
    @Field(
        () => String,
        {
            description: "The AI's answer, grounded in the content body.",
        },
    )
        answer: string
}

@ObjectType({
    description: "Response wrapper for the askContentAi mutation.",
})
/** GraphQL envelope so the interceptor can attach success/error metadata; `data` is the grounded answer and stays null on failure. */
export class AskContentAiResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AskContentAiData>
{
    @Field(
        () => AskContentAiData,
        {
            nullable: true,
            description: "The AI answer.",
        },
    )
        data: AskContentAiData
}
