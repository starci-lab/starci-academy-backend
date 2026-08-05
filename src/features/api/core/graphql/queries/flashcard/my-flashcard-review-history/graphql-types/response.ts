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
    description: "One completed flashcard review session, as read back for the viewer's history.",
})
/**
 * One completed flashcard review session, as read back for the
 * viewer's history -- mirrors `MyFlashcardQuizHistoryItem`, but scoped to a
 * deck (not mode/level/coverage/weakTags, which are cloze-quiz-only
 * concepts).
 */
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

@ObjectType({
    description: "A page of the viewer's completed flashcard review sessions.",
})
/**
 * A page of the viewer's completed flashcard review sessions + the total
 * count for pagination.
 */
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

@ObjectType({
    description: "Response wrapper for the myFlashcardReviewHistory query.",
})
/**
 * Response wrapper for the myFlashcardReviewHistory query.
 */
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
