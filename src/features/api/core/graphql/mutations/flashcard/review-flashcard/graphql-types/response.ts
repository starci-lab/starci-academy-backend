import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "When the reviewed flashcard is next due.",
})
/**
 * The scheduling result of a review: when the card is next due.
 */
export class ReviewFlashcardData {
    @Field(
        () => Date,
        {
            description: "When the card next becomes due.",
        },
    )
        dueAt: Date

    @Field(
        () => Int,
        {
            description: "XP granted by THIS grade: 2 on the first-ever review of the card by this user, 0 on any repeat review.",
        },
    )
        xpEarned: number
}

@ObjectType({
    description: "Response wrapper for the reviewFlashcard mutation.",
})
/**
 * Response wrapper for the reviewFlashcard mutation.
 */
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
