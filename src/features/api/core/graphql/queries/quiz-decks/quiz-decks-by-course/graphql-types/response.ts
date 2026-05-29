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
 * Response wrapper for the quizDecksByCourse query.
 */
@ObjectType({
    description: "Response wrapper for the quizDecksByCourse query.",
})
export class QuizDecksByCourseResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<QuizDeckEntity>>
{
    /**
     * Decks owned by the course, in display order.
     */
    @Field(
        () => [QuizDeckEntity],
        {
            nullable: true,
            description: "Decks owned by the course, in display order.",
        },
    )
        data: Array<QuizDeckEntity>
}
