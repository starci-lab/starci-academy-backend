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
    description: "Response wrapper for the flashcardDeck query.",
})
/**
 * Response wrapper for the flashcardDeck query.
 */
export class FlashcardDeckResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<FlashcardDeckEntity>
{
    /**
     * The requested deck with its cards, options, and translations.
     */
    @Field(
        () => FlashcardDeckEntity,
        {
            nullable: true,
            description: "The requested deck with its cards and options.",
        },
    )
        data: FlashcardDeckEntity
}
