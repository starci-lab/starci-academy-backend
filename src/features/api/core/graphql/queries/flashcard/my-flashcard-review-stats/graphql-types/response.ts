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
 * One day's review activity in the trailing window — cards graded across ALL
 * of that VN-calendar-day's completed sessions, zero-filled for rest days so
 * the chart reads as a true "did I study each day" consistency view.
 */
@ObjectType({
    description: "One day's flashcard review activity (cards reviewed that VN-calendar day).",
})
export class FlashcardReviewDailyActivityPoint {
    @Field(
        () => String,
        {
            description: "The VN-calendar day (YYYY-MM-DD).",
        },
    )
        date: string

    @Field(
        () => Int,
        {
            description: "Cards graded across every completed session that day (0 = rest day).",
        },
    )
        cardsReviewed: number
}

/** One deck's aggregate review footprint across the scanned sessions. */
@ObjectType({
    description: "One deck's aggregate review footprint across the viewer's scanned review sessions.",
})
export class FlashcardReviewStatsDeckItem {
    @Field(
        () => ID,
        {
            description: "The deck this aggregate is scoped to.",
        },
    )
        deckId: string

    @Field(
        () => String,
        {
            description: "The deck's title.",
        },
    )
        deckTitle: string

    @Field(
        () => Int,
        {
            description: "Completed review sessions scanned for this deck.",
        },
    )
        sessionCount: number

    @Field(
        () => Int,
        {
            description: "Total cards graded across every scanned session for this deck.",
        },
    )
        cardsReviewed: number

    @Field(
        () => Int,
        {
            description: "This deck's current total card count.",
        },
    )
        totalCards: number
}

/** One day's forecasted due-card count, in the trailing 7-day-forward window. */
@ObjectType({
    description: "One day's forecasted flashcard-due count, in the trailing 7-day-forward window.",
})
export class FlashcardDueForecastPoint {
    @Field(
        () => String,
        {
            description: "The VN-calendar day (YYYY-MM-DD).",
        },
    )
        date: string

    @Field(
        () => Int,
        {
            description: "Cards due that day (0 = nothing due).",
        },
    )
        count: number
}

/** The viewer's card-maturity breakdown for this course, by `repetitions` on `user_flashcard_reviews`. */
@ObjectType({
    description: "The viewer's card-maturity breakdown for this course (mastered / learning / new).",
})
export class FlashcardMasteryBreakdown {
    @Field(
        () => Int,
        {
            description: "Cards with repetitions >= 2 — considered mastered.",
        },
    )
        mastered: number

    @Field(
        () => Int,
        {
            description: "Cards reviewed at least once but not yet mastered.",
        },
    )
        learning: number

    @Field(
        () => Int,
        {
            description: "Cards in the course's decks never yet reviewed.",
        },
    )
        new: number
}

/**
 * The viewer's aggregated flashcard review ("Học thẻ") stats for one course —
 * mirrors `MyFlashcardQuizStatsData`, minus `byTag` (review sessions carry no
 * per-card correctness breakdown to derive a tag-coverage aggregate from).
 */
@ObjectType({
    description: "The viewer's aggregated flashcard review stats for one course.",
})
export class MyFlashcardReviewStatsData {
    @Field(
        () => [FlashcardReviewDailyActivityPoint],
        {
            description: "Cards reviewed per VN-day across the trailing window (zero-filled, oldest first).",
        },
    )
        dailyActivity: Array<FlashcardReviewDailyActivityPoint>

    @Field(
        () => [FlashcardReviewStatsDeckItem],
        {
            description: "Per-deck aggregate review footprint across the scanned sessions.",
        },
    )
        byDeck: Array<FlashcardReviewStatsDeckItem>

    @Field(
        () => Int,
        {
            description: "Cards due for review right now, scoped to the viewer's enrollment.",
        },
    )
        dueToday: number

    @Field(
        () => [FlashcardDueForecastPoint],
        {
            description: "Cards due per VN-day across the next 7 days (zero-filled, tomorrow first).",
        },
    )
        dueForecast: Array<FlashcardDueForecastPoint>

    @Field(
        () => FlashcardMasteryBreakdown,
        {
            description: "The viewer's card-maturity breakdown for this course (mastered / learning / new).",
        },
    )
        masteryBreakdown: FlashcardMasteryBreakdown
}

/**
 * Response wrapper for the myFlashcardReviewStats query.
 */
@ObjectType({
    description: "Response wrapper for the myFlashcardReviewStats query.",
})
export class MyFlashcardReviewStatsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyFlashcardReviewStatsData>
{
    @Field(
        () => MyFlashcardReviewStatsData,
        {
            nullable: true,
            description: "The viewer's aggregated flashcard review stats for one course.",
        },
    )
        data: MyFlashcardReviewStatsData
}
