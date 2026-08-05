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

/** The two "Học thẻ" scopes the deck-review mode modal offers. */
export type FlashcardReviewMode = "full" | "due"

/** Upper bound on the card set a single review session may draw — generous
 *  since a deck's full card set (unlike a quiz's fixed 5/10 draw) can run
 *  much larger; still bounded so a spoofed/buggy client cannot persist an
 *  unbounded array. */
const MAX_CARD_IDS = 200

@InputType({
    description: "Start a resumable flashcard review session for one deck + its card order.",
})
/**
 * Request to start (or resume-replace) ONE resumable flashcard review
 * ("Học thẻ") session over a single deck, mirroring
 * `startFlashcardQuizSession`'s server-persisted-draw shape. Unlike the quiz
 * draw, the SERVER does not pick the cards here (the FE's existing
 * deck-fetch + sort-by-`sortIndex` is unchanged) — this mutation only
 * PERSISTS the deck's card order so the session becomes resumable and so
 * `completeFlashcardReviewSession` has a real server-issued `sessionId` to
 * anchor its status flip to.
 */
export class StartFlashcardReviewSessionRequest {
    @Field(
        () => ID,
        {
            description: "Deck this review session belongs to — resolves the enrollment the session is anchored to and scopes resume lookups.",
        },
    )
        deckId: string

    @Field(
        () => [ID],
        {
            description: "The flashcard_cards.id set for this deck, in the order they will be reviewed.",
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
            nullable: true,
            description: "Which cards to persist: \"full\" (whole deck, default) or \"due\" (only cards needing review — no review row yet or past due_at). An empty \"due\" filter falls back to the full set.",
        },
    )
    @IsOptional()
    @IsIn([
        "full",
        "due",
    ])
        mode?: FlashcardReviewMode
}
