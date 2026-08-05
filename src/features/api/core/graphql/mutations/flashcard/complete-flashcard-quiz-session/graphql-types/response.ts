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

@ObjectType({
    description: "A weak technology tag from a finished quick-quiz session, with an optional review deep link.",
})
/**
 * One weak tag surfaced from the finished session -- the lowest-coverage
 * technology tags across the session's cards, ranked ascending (weakest
 * first), each optionally carrying a deep link back to the lesson/module it
 * came from so the recap can bridge a poor score into real review instead of
 * a dead-end "practice more" loop.
 */
export class QuizSessionWeakTagData {
    @Field(
        () => String,
        {
            description: "The technology tag (e.g. \"NestJS\", \"Redis\") this coverage is scoped to.",
        },
    )
        tag: string

    @Field(
        () => Float,
        {
            description: "This tag's coverage across the session's cards carrying it, 0..1.",
        },
    )
        coverage: number

    @Field(
        () => ID,
        {
            nullable: true,
            description: "The single module this tag's cards map back to; omitted when the deck-to-module mapping is ambiguous.",
        },
    )
        moduleId?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "The single content (lesson) this tag's cards map back to; omitted when the deck-to-content mapping is ambiguous.",
        },
    )
        contentId?: string
}

@ObjectType({
    description: "Readiness signal for surfacing an AI Mock Interview cross-link from the quick-quiz recap.",
})
/**
 * Readiness signal for the AI Mock Interview cross-link -- a cheap proxy
 * (flashcard retention rate) reused as-is rather than new cross-session
 * tracking, so the recap can nudge a consistently strong learner toward the
 * platform's actually-differentiated, AI-graded feature.
 */
export class QuizSessionReadinessData {
    @Field(
        () => Int,
        {
            description: "The proxy signal used for readiness — the viewer's flashcard retention rate, 0-100.",
        },
    )
        currentAvg: number

    @Field(
        () => Int,
        {
            description: "The retention-rate threshold at/above which the cross-link to Mock Interview unlocks.",
        },
    )
        threshold: number

    @Field(
        () => Boolean,
        {
            description: "Whether currentAvg has reached threshold.",
        },
    )
        unlocked: boolean
}

@ObjectType({
    description: "The outcome of a finished flashcard quick-quiz session.",
})
/**
 * The outcome of finishing a flashcard quick-quiz session: the XP granted,
 * this session's weakest tags (with review deep links where unambiguous),
 * and the AI Mock Interview readiness signal.
 */
export class CompleteFlashcardQuizSessionData {
    @Field(
        () => Int,
        {
            description: "XP granted this call (0 on an idempotent replay or a fully-capped day).",
        },
    )
        xpEarned: number

    @Field(
        () => Boolean,
        {
            description: "True when the daily XP cap for this (user, course, FlashcardQuiz) was already reached before this grant.",
        },
    )
        dailyCapReached: boolean

    @Field(
        () => [QuizSessionWeakTagData],
        {
            description: "Weakest-coverage tags this session, ranked ascending, capped at 5 — empty when the session answered nothing.",
        },
    )
        weakTags: Array<QuizSessionWeakTagData>

    @Field(
        () => QuizSessionReadinessData,
        {
            description: "Readiness signal for the AI Mock Interview cross-link.",
        },
    )
        readiness: QuizSessionReadinessData
}

@ObjectType({
    description: "Response wrapper for the completeFlashcardQuizSession mutation.",
})
/**
 * Response wrapper for the completeFlashcardQuizSession mutation.
 */
export class CompleteFlashcardQuizSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CompleteFlashcardQuizSessionData> {
    @Field(
        () => CompleteFlashcardQuizSessionData,
        {
            nullable: true,
            description: "The outcome of the completed session.",
        },
    )
        data: CompleteFlashcardQuizSessionData
}
