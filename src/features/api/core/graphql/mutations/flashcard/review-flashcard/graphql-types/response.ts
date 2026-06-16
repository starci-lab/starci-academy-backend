import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * The scheduling result of a review: when the card is next due.
 */
@ObjectType({
    description: "When the reviewed flashcard is next due.",
})
export class ReviewFlashcardData {
    @Field(
        () => Date,
        {
            description: "When the card next becomes due.",
        },
    )
        dueAt: Date
}

/**
 * Response wrapper for the reviewFlashcard mutation.
 */
@ObjectType({
    description: "Response wrapper for the reviewFlashcard mutation.",
})
export class ReviewFlashcardResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ReviewFlashcardData> {
    @Field(
        () => ReviewFlashcardData,
        {
            nullable: true,
            description: "The next due date for the reviewed card.",
        },
    )
        data: ReviewFlashcardData
}
