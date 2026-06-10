import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    FlashcardDeckEntity,
} from "@modules/databases"

/**
 * Response wrapper for the flashcardDecksByCourse query.
 */
@ObjectType({
    description: "Response wrapper for the flashcardDecksByCourse query.",
})
export class FlashcardDecksByCourseResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<FlashcardDeckEntity>>
{
    /**
     * Decks owned by the course, in display order.
     */
    @Field(
        () => [FlashcardDeckEntity],
        {
            nullable: true,
            description: "Decks owned by the course, in display order.",
        },
    )
        data: Array<FlashcardDeckEntity>
}
