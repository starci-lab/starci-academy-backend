import {
    Field,
    ID,
    Int,
    InputType,
} from "@nestjs/graphql"
import {
    IsInt,
    IsOptional,
    Min,
} from "class-validator"

/**
 * Periodically syncs an IN-FLIGHT flashcard review ("Học thẻ") session's
 * position + progress to the server — mirrors
 * `SyncFlashcardQuizSessionProgressRequest`'s shape, but with no per-card
 * cloze breakdown (review has none — grading itself already happens per-card
 * through the existing `reviewFlashcard` mutation); this just snapshots the
 * resumable cursor + counters so a learner who navigates away mid-review
 * (tab close, refresh, network drop) can pick their draw back up via
 * `myInProgressFlashcardReviewSession` instead of losing progress.
 */
@InputType({
    description: "Sync an in-flight flashcard review session's position + progress for later resume.",
})
export class SyncFlashcardReviewSessionProgressRequest {
    @Field(
        () => ID,
        {
            description: "Id of the session to sync (from startFlashcardReviewSession's sessionId).",
        },
    )
        sessionId: string

    @Field(
        () => Int,
        {
            description: "0-based index of the card the learner is currently on.",
        },
    )
    // a card index cannot be negative
    @IsInt()
    @Min(0)
        currentIndex: number

    @Field(
        () => Int,
        {
            description: "Cards actually graded so far this session (via reviewFlashcard).",
        },
    )
    // a reviewed count cannot be negative
    @IsInt()
    @Min(0)
        reviewedCount: number

    @Field(
        () => [Int],
        {
            nullable: true,
            description: "0-indexed card positions graded this session (order-independent) — drives the FE per-segment green, distinct from the plain reviewedCount. When provided it overwrites the row's set; when omitted the column is left unchanged.",
        },
    )
    // optional — a sync that does not carry the graded set leaves it untouched
    @IsOptional()
    // each entry is a non-negative card index
    @IsInt({
        each: true,
    })
    @Min(0,
        {
            each: true,
        })
        gradedIndexes?: Array<number>

    @Field(
        () => Int,
        {
            description: "Client-reported XP bookkeeping snapshot so far this session — NOT granted server-side (reviewFlashcard itself grants no XP today); persisted purely for history/stats display.",
        },
    )
    // an XP snapshot cannot be negative
    @IsInt()
    @Min(0)
        xpEarned: number
}
