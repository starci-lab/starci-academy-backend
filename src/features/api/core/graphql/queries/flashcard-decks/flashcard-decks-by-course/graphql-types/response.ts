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
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"

@ObjectType({
    description: "Response wrapper for the flashcardDecksByCourse query.",
})
/**
 * Response wrapper for the flashcardDecksByCourse query.
 */
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
