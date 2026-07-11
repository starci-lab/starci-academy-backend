import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsString,
} from "class-validator"

/** Upper bound on the card set a single due-review batch may draw — generous
 *  since a due batch spans multiple decks; still bounded so a spoofed/buggy
 *  client cannot persist an unbounded array. */
const MAX_CARD_IDS = 200

/**
 * Request to start (or resume-replace) ONE resumable CROSS-DECK due-review
 * batch session for a course, mirroring `startFlashcardReviewSession`'s
 * server-persisted-draw shape. Unlike the deck-scoped review draw, this is
 * NOT anchored to a `deckId` (the FE's existing cross-deck due-set draw is
 * unchanged) — this mutation only PERSISTS the drawn card order so the batch
 * becomes resumable and so `completeFlashcardDueReviewSession` has a real
 * server-issued `sessionId` to anchor its status flip to.
 */
@InputType({
    description: "Start a resumable cross-deck due-review batch session for one course + drawn card set.",
})
export class StartFlashcardDueReviewSessionRequest {
    @Field(
        () => ID,
        {
            description: "Course this due-review batch belongs to — resolves/creates the enrollment the session is anchored to.",
        },
    )
        courseId: string

    @Field(
        () => [ID],
        {
            description: "The flashcard_cards.id set drawn for this batch (across decks), in the order they will be asked.",
        },
    )
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(MAX_CARD_IDS)
    @IsString({
        each: true,
    })
        cardIds: Array<string>
}
