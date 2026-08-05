import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Per-grade next-interval preview (days) for a flashcard.",
})
/**
 * Per-grade next-interval preview (in days) computed from a card's current SM-2
 * state without persisting -- mirrors `DueFlashcardObject`'s own field so the two
 * queries return interchangeable shapes for the FE.
 */
export class FlashcardByIdNextIntervalsObject {
    @Field(
        () => Int,
        {
            description: "Days until next review if graded Again (0).",
        },
    )
        again: number

    @Field(
        () => Int,
        {
            description: "Days until next review if graded Hard (1).",
        },
    )
        hard: number

    @Field(
        () => Int,
        {
            description: "Days until next review if graded Good (2).",
        },
    )
        good: number

    @Field(
        () => Int,
        {
            description: "Days until next review if graded Easy (3).",
        },
    )
        easy: number
}

@ObjectType({
    description: "A flashcard fetched by exact id (localized front/back + deck title), regardless of due status.",
})
/**
 * One flashcard fetched by exact id, localized -- same shape as `DueFlashcardObject`
 * but not filtered by due status.
 */
export class FlashcardByIdObject {
    @Field(
        () => ID,
        {
            description: "The flashcard card id.",
        },
    )
        cardId: string

    @Field(
        () => String,
        {
            description: "Owning deck title (localized).",
        },
    )
        deckTitle: string

    @Field(
        () => String,
        {
            description: "Card front / question (localized).",
        },
    )
        front: string

    @Field(
        () => String,
        {
            description: "Card back / answer (localized).",
        },
    )
        back: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Interview seniority level (junior/middle/senior/staff), or null — drives the level chip.",
        },
    )
        level: string | null

    @Field(
        () => [String],
        {
            description: "Technology tags for this card — drives the tag chips (same as deck-review).",
        },
    )
        tags: Array<string>

    @Field(
        () => FlashcardByIdNextIntervalsObject,
        {
            description: "Per-grade next-interval preview (days) from the card's current state.",
        },
    )
        nextIntervals: FlashcardByIdNextIntervalsObject
}

@ObjectType({
    description: "Flashcards fetched by exact id, in input order.",
})
/**
 * The requested flashcards, in the same order as the input `cardIds`.
 */
export class FlashcardCardsByIdsData {
    @Field(
        () => [FlashcardByIdObject],
        {
            nullable: true,
            description: "The requested cards, localized, in `cardIds` order (a missing/deleted id is simply dropped).",
        },
    )
        cards: Array<FlashcardByIdObject>
}

@ObjectType({
    description: "Response wrapper for the flashcardCardsByIds query.",
})
/**
 * Response wrapper for the flashcardCardsByIds query.
 */
export class FlashcardCardsByIdsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<FlashcardCardsByIdsData> {
    @Field(
        () => FlashcardCardsByIdsData,
        {
            nullable: true,
            description: "The requested flashcards.",
        },
    )
        data: FlashcardCardsByIdsData
}
