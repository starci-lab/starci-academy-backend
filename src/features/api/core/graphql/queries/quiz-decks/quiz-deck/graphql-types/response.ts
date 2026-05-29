import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    QuizDeckEntity,
} from "@modules/databases"

/**
 * Response wrapper for the quizDeck query.
 */
@ObjectType({
    description: "Response wrapper for the quizDeck query.",
})
export class QuizDeckResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<QuizDeckEntity>
{
    /**
     * The requested deck with its cards, options, and translations.
     */
    @Field(
        () => QuizDeckEntity,
        {
            nullable: true,
            description: "The requested deck with its cards and options.",
        },
    )
        data: QuizDeckEntity
}
