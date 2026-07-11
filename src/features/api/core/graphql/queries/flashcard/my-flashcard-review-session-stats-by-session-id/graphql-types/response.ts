import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Per-SM-2-grade tally of the events graded within one review session
 * (Again/Hard/Good/Easy = grade 0/1/2/3). All zero in the degraded case (a
 * session whose events carry no `sessionId`).
 */
@ObjectType({
    description: "Per-grade (Again/Hard/Good/Easy) tally of one session's review events.",
})
export class FlashcardReviewSessionGradeCountsData {
    @Field(
        () => Int,
        {
            description: "Grade 0 — \"Again\" (forgot).",
        },
    )
        again: number

    @Field(
        () => Int,
        {
            description: "Grade 1 — \"Hard\".",
        },
    )
        hard: number

    @Field(
        () => Int,
        {
            description: "Grade 2 — \"Good\".",
        },
    )
        good: number

    @Field(
        () => Int,
        {
            description: "Grade 3 — \"Easy\".",
        },
    )
        easy: number
}

/**
 * One weak-tag row — a technology tag the learner forgot ("Again") on during
 * this session, with the number of times. Feeds the FE weak-tags chips + the
 * RAG "study this" query.
 */
@ObjectType({
    description: "A technology tag the learner forgot on this session, with its forgot count.",
})
export class FlashcardReviewSessionWeakTagData {
    @Field(
        () => String,
        {
            description: "The technology tag (from the forgotten card's tags).",
        },
    )
        tag: string

    @Field(
        () => Int,
        {
            description: "How many \"Again\" events in this session carried this tag.",
        },
    )
        forgotCount: number
}

/**
 * Computed recap for ONE flashcard review session, resolved by its id alone
 * (either kind — single-deck review or cross-deck due-review) REGARDLESS of
 * status, and owner-scoped via the session's enrollment. The query resolves to
 * `null` (not this type) when the id is not found / not owned by the caller.
 *
 * DEGRADED case (a legacy/untracked session whose events carry no `sessionId`)
 * still returns a valid object: `reviewedCount` comes from the session entity,
 * `gradeCounts` are all zero, `weakTags` is empty, `durationSeconds` is null —
 * so the FE renders a count-only fallback instead of erroring.
 */
@ObjectType({
    description: "Computed recap (per-grade breakdown, weak-tags, duration, xp, next due) for one flashcard review session.",
})
export class MyFlashcardReviewSessionStatsBySessionIdData {
    @Field(
        () => ID,
        {
            description: "Id of the session (echoes the input, for convenience).",
        },
    )
        sessionId: string

    @Field(
        () => String,
        {
            description: "The session's lifecycle state: \"in_progress\" | \"completed\" | \"abandoned\" (resolved regardless of status).",
        },
    )
        status: "in_progress" | "completed" | "abandoned"

    @Field(
        () => Int,
        {
            description: "Total reviews attributed to this session (event count carrying this sessionId, or the session's own reviewedCount fallback when none do).",
        },
    )
        reviewedCount: number

    @Field(
        () => FlashcardReviewSessionGradeCountsData,
        {
            description: "Per-grade breakdown across this session's events (all zero in the degraded case).",
        },
    )
        gradeCounts: FlashcardReviewSessionGradeCountsData

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Wall-clock span of the session (last − first event, seconds), or null when fewer than 2 events carry the id.",
        },
    )
        durationSeconds?: number

    @Field(
        () => Int,
        {
            description: "XP granted by this session's FIRST-EVER-review events (2 each); typically 0 for a due-review of already-seen cards.",
        },
    )
        xpEarned: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "ISO timestamp of the earliest upcoming dueAt among the session's cards, or null when none is scheduled.",
        },
    )
        nextDueAt?: string

    @Field(
        () => [FlashcardReviewSessionWeakTagData],
        {
            description: "Top technology tags the learner forgot on this session (grade 0), most-forgotten first (empty when none).",
        },
    )
        weakTags: Array<FlashcardReviewSessionWeakTagData>
}

/**
 * Response wrapper for the myFlashcardReviewSessionStatsBySessionId query —
 * `data` is `null` when the session id is not found / not owned by the caller.
 */
@ObjectType({
    description: "Response wrapper for the myFlashcardReviewSessionStatsBySessionId query.",
})
export class MyFlashcardReviewSessionStatsBySessionIdResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFlashcardReviewSessionStatsBySessionIdData>
{
    @Field(
        () => MyFlashcardReviewSessionStatsBySessionIdData,
        {
            nullable: true,
            description: "The computed session recap, or null when the id is not found/not owned by the caller.",
        },
    )
        data: MyFlashcardReviewSessionStatsBySessionIdData
}
