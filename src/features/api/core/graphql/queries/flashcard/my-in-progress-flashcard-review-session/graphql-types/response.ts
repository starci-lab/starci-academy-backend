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

@ObjectType({
    description: "The learner's most recent resumable flashcard review session for one deck.",
})
/**
 * The learner's most recent RESUMABLE flashcard review session
 * for one deck. The query itself resolves to `null` (not this type) when
 * there is none.
 */
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
        () => [Int],
        {
            description: "0-indexed card positions graded this session (order-independent) — rehydrates the FE per-segment green on resume, distinct from the plain reviewedCount.",
        },
    )
        gradedIndexes: Array<number>

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
/**
 * GraphQL envelope for `myInProgressFlashcardReviewSession`. `data` is
 * null when the learner has no resumable single-deck review session --
 * the FE should start a new review rather than resume.
 */
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
