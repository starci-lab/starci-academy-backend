import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsIn,
    IsOptional,
    IsString,
} from "class-validator"

/** Upper bound on the card set a single quick-quiz session may draw — mirrors `completeFlashcardQuizSession`'s MAX_ANSWERS ceiling so a session can never outgrow what it can eventually be scored on. */
const MAX_CARD_IDS = 10

/**
 * Request to start (or resume-replace) ONE resumable flashcard quick-quiz
 * ("Hỏi nhanh") session — "resume flashcard quiz session" (2026-07-08),
 * mirroring `startMockInterviewSession`'s server-persisted-draw shape. Unlike
 * the mock-interview draw, the SERVER does not pick the cards here (the FE's
 * existing client-side deck/level selection is unchanged) — this mutation
 * only PERSISTS the drawn set so the session becomes resumable and so
 * `completeFlashcardQuizSession` has a real server-issued `sessionId` to
 * anchor its idempotency + status flip to.
 */
@InputType({
    description: "Start a resumable flashcard quick-quiz session for one course + drawn card set.",
})
export class StartFlashcardQuizSessionRequest {
    @Field(
        () => ID,
        {
            description: "Course this session belongs to — resolves/creates the enrollment the session is anchored to.",
        },
    )
        courseId: string

    @Field(
        () => [ID],
        {
            description: "The flashcard_cards.id set drawn for this session, in the order they will be asked.",
        },
    )
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(MAX_CARD_IDS)
    @IsString({
        each: true,
    })
        cardIds: Array<string>

    @Field(
        () => String,
        {
            description: "Practice mode chosen at setup (\"quick\"|\"deep\") — persisted so history/stats can show it.",
        },
    )
    @IsIn([
        "quick",
        "deep",
    ])
        mode: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Seniority level filter chosen at setup, or null for \"all levels\" — persisted so history/stats can show it.",
        },
    )
    @IsOptional()
    @IsString()
        level: string | null
}
