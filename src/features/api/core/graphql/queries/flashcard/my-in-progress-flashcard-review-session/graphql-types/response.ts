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
 * The learner's most recent RESUMABLE flashcard review ("Học thẻ") session
 * for one deck. The query itself resolves to `null` (not this type) when
 * there is none.
 */
@ObjectType({
    description: "The learner's most recent resumable flashcard review session for one deck.",
})
export class MyInProgressFlashcardReviewSessionData {
    @Field(
        () => ID,
        {
            description: "Id of the persisted session — pass to syncFlashcardReviewSessionProgress / completeFlashcardReviewSession.",
        },
    )
        sessionId: string

    @Field(
        () => [ID],
        {
            description: "The flashcard_cards.id set for this deck, in review order.",
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
    description: "Response wrapper for the myInProgressFlashcardReviewSession query.",
})
export class MyInProgressFlashcardReviewSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyInProgressFlashcardReviewSessionData>
{
    @Field(
        () => MyInProgressFlashcardReviewSessionData,
        {
            nullable: true,
            description: "The learner's most recent resumable session, or null when none exists.",
        },
    )
        data: MyInProgressFlashcardReviewSessionData
}
