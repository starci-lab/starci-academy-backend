import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    IsInt,
    Min,
} from "class-validator"

/**
 * Request to record a finished cross-deck due-review batch session.
 *
 * Unlike `completeFlashcardQuizSession`, this does NOT carry a per-card
 * answer breakdown and does NOT grant any XP server-side: `reviewFlashcard`
 * (the per-card SM-2 grading mutation this session wraps) grants no XP today
 * and writes no `xp_histories` row, so `xpEarned` here is purely a
 * CLIENT-REPORTED bookkeeping snapshot to persist onto the row for
 * history/stats display — never a server grant. Mirrors
 * `CompleteFlashcardReviewSessionRequest`.
 */
@InputType({
    description: "Request to record a finished cross-deck due-review batch session.",
})
export class CompleteFlashcardDueReviewSessionRequest {
    @Field(
        () => ID,
        {
            description: "Session id — the SERVER-ISSUED id from startFlashcardDueReviewSession's sessionId.",
        },
    )
        sessionId: string

    @Field(
        () => Int,
        {
            description: "Final reviewed-card count to snapshot onto the row.",
        },
    )
    // a reviewed count cannot be negative
    @IsInt()
    @Min(0)
        reviewedCount: number

    @Field(
        () => Int,
        {
            description: "Final XP bookkeeping snapshot to persist onto the row — NOT granted server-side (reviewFlashcard itself grants no XP today).",
        },
    )
    // an XP snapshot cannot be negative
    @IsInt()
    @Min(0)
        xpEarned: number
}
