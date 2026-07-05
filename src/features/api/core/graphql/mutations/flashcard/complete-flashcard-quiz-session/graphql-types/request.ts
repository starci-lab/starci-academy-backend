import {
    Field,
    Float,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    IsInt,
    Max,
    Min,
} from "class-validator"

/**
 * Request to record a finished flashcard quick-quiz ("Hỏi nhanh") session and
 * grant its capped XP reward.
 */
@InputType({
    description: "Request to record a finished flashcard quick-quiz session.",
})
export class CompleteFlashcardQuizSessionRequest {
    @Field(
        () => ID,
        {
            description: "Client-generated session id (idempotency key → xp_history refId).",
        },
    )
        sessionId: string

    @Field(
        () => ID,
        {
            description: "Course the session belongs to (scopes the xp_history course).",
        },
    )
        courseId: string

    @Field(
        () => Int,
        {
            description: "How many cards were answered this session.",
        },
    )
    // a session cannot answer a negative number of cards
    @IsInt()
    @Min(0)
        answeredCount: number

    @Field(
        () => Float,
        {
            description: "Aggregate keyword + layer coverage across the session, 0..1.",
        },
    )
    // coverage is a ratio in [0, 1] — reject anything outside the range early
    @Min(0)
    @Max(1)
        coverageScore: number
}
