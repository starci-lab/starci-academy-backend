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
 * A flashcard "Học thẻ" session resolved directly by its id — either kind
 * (single-deck review, or the cross-deck due-review batch). The query itself
 * resolves to `null` (not this type) when the id is not found/not owned by
 * the caller.
 */
@ObjectType({
    description: "A flashcard review/due-review session resolved by its id, whichever kind it is.",
})
export class MyFlashcardReviewSessionBySessionIdData {
    @Field(
        () => ID,
        {
            description: "Id of the session (echoes the input, for convenience).",
        },
    )
        sessionId: string

    @Field(
        () => String,
        {
            description: "\"deck\" (single-deck review, `deckId`/`deckTitle` present) or \"due\" (cross-deck due-review batch, both null).",
        },
    )
        kind: "deck" | "due"

    @Field(
        () => ID,
        {
            nullable: true,
            description: "The deck this session reviews — present only when kind is \"deck\".",
        },
    )
        deckId?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "The deck's display title — present only when kind is \"deck\".",
        },
    )
        deckTitle?: string

    @Field(
        () => [ID],
        {
            description: "The flashcard_cards.id set for this session, in review/ask order.",
        },
    )
        cardIds: Array<string>

    @Field(
        () => Int,
        {
            description: "0-based index of the card the learner was on at the last sync.",
        },
    )
        currentIndex: number

    @Field(
        () => Int,
        {
            description: "Cards actually graded so far this session.",
        },
    )
        reviewedCount: number

    @Field(
        () => Int,
        {
            description: "Client-reported XP bookkeeping snapshot so far this session (not a server grant).",
        },
    )
        xpEarned: number

    @Field(
        () => String,
        {
            description: "ISO timestamp of when this session was last synced/updated.",
        },
    )
        updatedAt: string
}

@ObjectType({
    description: "Response wrapper for the myFlashcardReviewSessionBySessionId query.",
})
export class MyFlashcardReviewSessionBySessionIdResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFlashcardReviewSessionBySessionIdData>
{
    @Field(
        () => MyFlashcardReviewSessionBySessionIdData,
        {
            nullable: true,
            description: "The session (deck or due kind), or null when the id is not found/not owned by the caller.",
        },
    )
        data: MyFlashcardReviewSessionBySessionIdData
}
