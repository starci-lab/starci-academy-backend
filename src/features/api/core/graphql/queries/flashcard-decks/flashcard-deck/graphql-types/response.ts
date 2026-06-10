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
 * Response wrapper for the flashcardDeck query.
 */
@ObjectType({
    description: "Response wrapper for the flashcardDeck query.",
})
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
