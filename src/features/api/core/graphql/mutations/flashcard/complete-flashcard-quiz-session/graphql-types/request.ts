import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    ArrayMaxSize,
    IsArray,
    IsInt,
    Min,
    ValidateNested,
} from "class-validator"
import {
    Type,
} from "class-transformer"

/** Upper bound on the answers array accepted in one complete call — mirrors the service's MAX_ANSWERED_CARDS ceiling. */
const MAX_ANSWERS = 10

/**
 * One card's outcome within the finished session, as reported by the client.
 * The server re-derives the session's aggregate coverage from this
 * per-card breakdown — it never trusts a client-sent aggregate score.
 */
@InputType({
    description: "One card's cloze outcome within a finished flashcard quick-quiz session.",
})
export class QuizSessionAnswerRequest {
    @Field(
        () => ID,
        {
            description: "The flashcard this answer belongs to.",
        },
    )
        cardId: string

    @Field(
        () => Int,
        {
            description: "How many cloze blanks on this card the learner filled correctly.",
        },
    )
    // a card cannot have a negative number of correct blanks
    @IsInt()
    @Min(0)
        correctBlanks: number

    @Field(
        () => Int,
        {
            description: "Total cloze blanks on this card (the denominator for this card's coverage).",
        },
    )
    // a card cannot have a negative number of total blanks
    @IsInt()
    @Min(0)
        totalBlanks: number
}

/**
 * Request to record a finished flashcard quick-quiz ("Hỏi nhanh") session and
 * grant its capped XP reward. Carries the PER-CARD answer breakdown so the
 * server can re-derive coverage itself (never trusting a client-sent
 * aggregate score) and compute per-tag weak spots for the recap.
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
            description: "Course the session belongs to (scopes the xp_history course + daily cap).",
        },
    )
        courseId: string

    @Field(
        () => [QuizSessionAnswerRequest],
        {
            description: "Per-card breakdown this session answered — the source of truth for scoring.",
        },
    )
    // bounded per-card breakdown; each element is itself validated (ValidateNested + Type)
    @IsArray()
    @ArrayMaxSize(MAX_ANSWERS)
    @ValidateNested({
        each: true,
    })
    @Type(() => QuizSessionAnswerRequest)
        answers: Array<QuizSessionAnswerRequest>
}
