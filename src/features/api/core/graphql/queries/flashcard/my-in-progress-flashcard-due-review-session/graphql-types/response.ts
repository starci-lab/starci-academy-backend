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
    description: "The learner's most recent resumable cross-deck due-review batch session for one course.",
})
/**
 * The learner's most recent RESUMABLE cross-deck due-review batch session
 * for one course. The query itself resolves to `null` (not this type) when
 * there is none.
 */
export class MyInProgressFlashcardDueReviewSessionData {
    @Field(
        () => ID,
        {
            description: "Id of the persisted session — pass to syncFlashcardDueReviewSessionProgress / completeFlashcardDueReviewSession.",
        },
    )
        sessionId: string

    @Field(
        () => [ID],
        {
            description: "The flashcard_cards.id set drawn for this batch, in ask order.",
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
            description: "Cards actually graded so far this batch.",
        },
    )
        reviewedCount: number

    @Field(
        () => [Int],
        {
            description: "0-indexed card positions graded this batch (order-independent) — rehydrates the FE per-segment green on resume, distinct from the plain reviewedCount.",
        },
    )
        gradedIndexes: Array<number>

    @Field(
        () => Int,
        {
            description: "Client-reported XP bookkeeping snapshot so far this batch (not a server grant).",
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
    description: "Response wrapper for the myInProgressFlashcardDueReviewSession query.",
})
/**
 * GraphQL envelope for `myInProgressFlashcardDueReviewSession`. `data` is
 * null when the learner has no resumable cross-deck due batch — the FE
 * should start a new session rather than resume.
 */
export class MyInProgressFlashcardDueReviewSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyInProgressFlashcardDueReviewSessionData>
{
    @Field(
        () => MyInProgressFlashcardDueReviewSessionData,
        {
            nullable: true,
            description: "The learner's most recent resumable session, or null when none exists.",
        },
    )
        data: MyInProgressFlashcardDueReviewSessionData
}
