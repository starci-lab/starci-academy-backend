import {
    Field,
    Float,
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
    QuizSessionWeakTagData,
} from "../../../../mutations/flashcard/complete-flashcard-quiz-session/graphql-types/response"

@ObjectType({
    description: "One completed flashcard quick-quiz session, as read back for the viewer's history.",
})
/**
 * One completed flashcard quick-quiz session, as read back for the viewer's
 * history -- "history + stats" (2026-07-08).
 */
export class MyFlashcardQuizHistoryItem {
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
        () => String,
        {
            description: "Practice mode chosen at setup (\"quick\"|\"deep\").",
        },
    )
        mode: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Seniority level filter chosen at setup, or null for \"all levels\".",
        },
    )
        level: string | null

    @Field(
        () => Int,
        {
            description: "How many cards this session drew.",
        },
    )
        cardCount: number

    @Field(
        () => Int,
        {
            description: "How many cards the learner got fully correct (all cloze blanks) — the discrete score (correctCount/cardCount).",
        },
    )
        correctCount: number

    @Field(
        () => Float,
        {
            nullable: true,
            description: "The session's server-derived aggregate coverage (0..1), or null if never completed with a coverage snapshot.",
        },
    )
        coverage: number | null

    @Field(
        () => Int,
        {
            description: "XP granted for this session (post daily-cap clamp).",
        },
    )
        xpEarned: number

    @Field(
        () => [QuizSessionWeakTagData],
        {
            description: "This session's weakest-coverage tags, snapshotted at completion.",
        },
    )
        weakTags: Array<QuizSessionWeakTagData>

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional user-chosen name for this practice session; null when the learner didn't name it (FE renders a time-based fallback).",
        },
    )
        name: string | null
}

@ObjectType({
    description: "A page of the viewer's completed flashcard quick-quiz sessions.",
})
/**
 * A page of the viewer's completed flashcard quick-quiz sessions + the total
 * count for pagination.
 */
export class MyFlashcardQuizHistoryData {
    @Field(
        () => Int,
        {
            description: "Total completed sessions for this (viewer, course), independent of pagination.",
        },
    )
        totalCount: number

    @Field(
        () => [MyFlashcardQuizHistoryItem],
        {
            description: "The requested page of sessions, newest first.",
        },
    )
        items: Array<MyFlashcardQuizHistoryItem>
}

@ObjectType({
    description: "Response wrapper for the myFlashcardQuizHistory query.",
})
/**
 * Response wrapper for the myFlashcardQuizHistory query.
 */
export class MyFlashcardQuizHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFlashcardQuizHistoryData>
{
    @Field(
        () => MyFlashcardQuizHistoryData,
        {
            nullable: true,
            description: "The requested page of the viewer's completed flashcard quick-quiz sessions.",
        },
    )
        data: MyFlashcardQuizHistoryData
}
