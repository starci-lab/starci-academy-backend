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
 * One completed flashcard review ("Học thẻ") session, as read back for the
 * viewer's history — mirrors `MyFlashcardQuizHistoryItem`, but scoped to a
 * deck (not mode/level/coverage/weakTags, which are cloze-quiz-only
 * concepts).
 */
@ObjectType({
    description: "One completed flashcard review session, as read back for the viewer's history.",
})
export class MyFlashcardReviewHistoryItem {
    @Field(
        () => ID,
        {
            description: "The session's persisted id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "ISO timestamp of when this session was last updated (its completion time).",
        },
    )
        updatedAt: string

    @Field(
        () => ID,
        {
            description: "The deck this session reviewed.",
        },
    )
        deckId: string

    @Field(
        () => String,
        {
            description: "The deck's title.",
        },
    )
        deckTitle: string

    @Field(
        () => Int,
        {
            description: "How many cards this session's deck snapshot carried.",
        },
    )
        cardCount: number

    @Field(
        () => Int,
        {
            description: "Cards actually graded this session.",
        },
    )
        reviewedCount: number

    @Field(
        () => Int,
        {
            description: "XP bookkeeping snapshot for this session (not a server grant).",
        },
    )
        xpEarned: number
}

/**
 * A page of the viewer's completed flashcard review sessions + the total
 * count for pagination.
 */
@ObjectType({
    description: "A page of the viewer's completed flashcard review sessions.",
})
export class MyFlashcardReviewHistoryData {
    @Field(
        () => Int,
        {
            description: "Total completed sessions for this (viewer, course), independent of pagination.",
        },
    )
        totalCount: number

    @Field(
        () => [MyFlashcardReviewHistoryItem],
        {
            description: "The requested page of sessions, newest first.",
        },
    )
        items: Array<MyFlashcardReviewHistoryItem>
}

/**
 * Response wrapper for the myFlashcardReviewHistory query.
 */
@ObjectType({
    description: "Response wrapper for the myFlashcardReviewHistory query.",
})
export class MyFlashcardReviewHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFlashcardReviewHistoryData>
{
    @Field(
        () => MyFlashcardReviewHistoryData,
        {
            nullable: true,
            description: "The requested page of the viewer's completed flashcard review sessions.",
        },
    )
        data: MyFlashcardReviewHistoryData
}
