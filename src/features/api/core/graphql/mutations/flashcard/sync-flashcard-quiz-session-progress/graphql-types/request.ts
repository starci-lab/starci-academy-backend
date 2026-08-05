import {
    Field,
    ID,
    Int,
    InputType,
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

/** Upper bound on the results array accepted in one sync call — mirrors `completeFlashcardQuizSession`'s MAX_ANSWERS ceiling. */
const MAX_RESULTS = 10

@InputType({
    description: "One card's in-flight cloze outcome within a flashcard quick-quiz session.",
})
/**
 * One card's outcome within the IN-FLIGHT session, as reported by the
 * client — the exact shape `completeFlashcardQuizSession`'s
 * `QuizSessionAnswerRequest` already accepts, reused here (not a parallel
 * duplicate type) so the eventual complete call re-sends this same
 * per-card breakdown.
 */
export class FlashcardQuizSessionResultRequest {
    @Field(
        () => ID,
        {
            description: "The flashcard this result belongs to.",
        },
    )
        cardId: string

    @Field(
        () => Int,
        {
            description: "How many cloze blanks on this card the learner filled correctly so far.",
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

@InputType({
    description: "Sync an in-flight flashcard quick-quiz session's per-card results + position for later resume.",
})
/**
 * Periodically syncs an IN-FLIGHT flashcard quick-quiz session's per-card
 * results + position to the server — "resume flashcard quiz session"
 * (2026-07-08), so a learner who navigates away mid-quiz (tab close,
 * refresh, network drop) can pick their draw back up via
 * `myInProgressFlashcardQuizSession` instead of losing progress and being
 * forced into a fresh draw. Mirrors `syncMockInterviewSessionTurns`'s shape.
 */
export class SyncFlashcardQuizSessionProgressRequest {
    @Field(
        () => ID,
        {
            description: "Id of the session to sync (from startFlashcardQuizSession's sessionId).",
        },
    )
        sessionId: string

    @Field(
        () => Int,
        {
            description: "0-based index of the card the learner is currently on.",
        },
    )
        currentIndex: number

    @Field(
        () => [FlashcardQuizSessionResultRequest],
        {
            description: "The per-card results recorded so far, one entry per answered card.",
        },
    )
    // bounded per-card breakdown; each element is itself validated (ValidateNested + Type)
    @IsArray()
    @ArrayMaxSize(MAX_RESULTS)
    @ValidateNested({
        each: true,
    })
    @Type(() => FlashcardQuizSessionResultRequest)
        results: Array<FlashcardQuizSessionResultRequest>
}
