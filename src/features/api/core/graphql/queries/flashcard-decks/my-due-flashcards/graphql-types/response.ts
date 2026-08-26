import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    FlashcardNextIntervalsObject,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"

@ObjectType({
    description: "A due flashcard (localized front/back + deck title).",
})
/**
 * One due flashcard in the spaced-repetition queue, localized.
 */
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
        () => Boolean,
        {
            description: "Whether this viewer may read a meaningful answer for the card.",
        },
    )
        answerAvailable: boolean

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
        () => FlashcardNextIntervalsObject,
        {
            description: "Per-grade next-interval preview (days) from the card's current state.",
        },
    )
        nextIntervals: FlashcardNextIntervalsObject
}

@ObjectType({
    description: "Due-flashcard queue (count + first page of cards).",
})
/**
 * The viewer's due-flashcard queue: total due count + first page of cards.
 */
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

@ObjectType({
    description: "Response wrapper for the myDueFlashcards query.",
})
/**
 * Response wrapper for the myDueFlashcards query.
 */
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
