import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** The AI answer to one content question. */
@ObjectType({
    description: "Answer to a content question from StarCi AI.",
})
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
