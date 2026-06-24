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
 * Per-grade next-interval preview (in days) computed from a card's current SM-2
 * state without persisting — powers the rating buttons.
 */
@ObjectType({
    description: "Per-grade next-interval preview (days) for a due card.",
})
export class FlashcardNextIntervalsObject {
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

    @Field(
        () => FlashcardNextIntervalsObject,
        {
            description: "Per-grade next-interval preview (days) from the card's current state.",
        },
    )
        nextIntervals: FlashcardNextIntervalsObject
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
            description: "Today's actionable queue = overdue reviews + capped new batch (NOT the whole backlog).",
        },
    )
        dueCount: number

    @Field(
        () => Int,
        {
            description: "Overdue review cards (learned once, now past due).",
        },
    )
        dueReviewCount: number

    @Field(
        () => Int,
        {
            description: "New cards offered today = min(newTotalCount, daily new limit).",
        },
    )
        newCount: number

    @Field(
        () => Int,
        {
            description: "Total never-reviewed cards in the course (full new backlog).",
        },
    )
        newTotalCount: number

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
