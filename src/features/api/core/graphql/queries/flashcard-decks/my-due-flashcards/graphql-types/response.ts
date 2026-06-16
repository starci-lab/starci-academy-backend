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

/**
 * One due flashcard in the spaced-repetition queue, localized.
 */
@ObjectType({
    description: "A due flashcard (localized front/back + deck title).",
})
export class DueFlashcardObject {
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
}

/**
 * The viewer's due-flashcard queue: total due count + first page of cards.
 */
@ObjectType({
    description: "Due-flashcard queue (count + first page of cards).",
})
export class MyDueFlashcardsData {
    @Field(
        () => Int,
        {
            description: "Total number of due cards across the viewer's enrolled decks.",
        },
    )
        dueCount: number

    @Field(
        () => [DueFlashcardObject],
        {
            nullable: true,
            description: "The first `limit` due cards, localized.",
        },
    )
        cards: Array<DueFlashcardObject>
}

/**
 * Response wrapper for the myDueFlashcards query.
 */
@ObjectType({
    description: "Response wrapper for the myDueFlashcards query.",
})
export class MyDueFlashcardsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyDueFlashcardsData> {
    @Field(
        () => MyDueFlashcardsData,
        {
            nullable: true,
            description: "The viewer's due-flashcard queue.",
        },
    )
        data: MyDueFlashcardsData
}
