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

/** One "leech" card the learner keeps forgetting (graded Again), most-forgotten first. */
@ObjectType({
    description: "A card the learner keeps forgetting (graded Again), for the 'cần ôn lại' hero.",
})
export class FlashcardLeechCard {
    @Field(() => ID, { description: "The card id (open it in the reviewer)." })
        cardId: string

    @Field(() => String, { description: "The card's question text (default-locale snapshot)." })
        question: string

    @Field(() => Int, { description: "How many times this card was graded Again (grade 0)." })
        forgotCount: number

    @Field(() => ID, { description: "Owning deck id (deep-link target)." })
        deckId: string

    @Field(() => String, { description: "Owning deck title." })
        deckTitle: string
}

/** The single weakest technology tag by review retention, or null when none has enough samples. */
@ObjectType({
    description: "The single weakest tag by review retention.",
})
export class FlashcardWeakReviewTag {
    @Field(() => String, { description: "The technology tag (e.g. NestJS)." })
        tag: string

    @Field(() => Int, { description: "Retention for this tag = graded Good/Easy / total graded, 0..100." })
        retention: number

    @Field(() => Int, { description: "Total graded reviews of cards carrying this tag." })
        reviewCount: number
}

/** One deck's review RETENTION (recalled/total) — the outcome analogue of the footprint `byDeck`. */
@ObjectType({
    description: "One deck's review retention (outcome), weakest first.",
})
export class FlashcardDeckRetention {
    @Field(() => ID, { description: "The deck this retention is scoped to." })
        deckId: string

    @Field(() => String, { description: "The deck's title." })
        deckTitle: string

    @Field(() => Int, { description: "Retention = graded Good/Easy / total graded for this deck, 0..100." })
        retention: number

    @Field(() => Int, { description: "Total graded reviews for this deck." })
        reviewCount: number
}

/** One VN-day's review retention — powers the 'đang cải thiện?' trend line. */
@ObjectType({
    description: "One VN-day's review retention (improvement trend point).",
})
export class FlashcardRetentionTrendPoint {
    @Field(() => String, { description: "The VN-calendar day (YYYY-MM-DD)." })
        date: string

    @Field(() => Int, { description: "Retention that day = recalled/total, 0..100." })
        retention: number

    @Field(() => Int, { description: "Reviews graded that day." })
        reviewCount: number
}

/**
 * The viewer's aggregated flashcard review ("Học thẻ") stats for one course.
 * Outcome aggregates (`leechCards`/`weakReviewTag`/`deckRetention`/`retentionTrend`,
 * thầy 2026-07-13 "render lại") lead; the older footprint/activity fields support.
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

    @Field(
        () => [FlashcardLeechCard],
        {
            description: "Cards the learner keeps forgetting, most-forgotten first — the 'cần ôn lại' hero.",
        },
    )
        leechCards: Array<FlashcardLeechCard>

    @Field(
        () => FlashcardWeakReviewTag,
        {
            nullable: true,
            description: "The single weakest tag by review retention, or null when none qualifies.",
        },
    )
        weakReviewTag: FlashcardWeakReviewTag | null

    @Field(
        () => [FlashcardDeckRetention],
        {
            description: "Per-deck review retention (outcome), weakest first.",
        },
    )
        deckRetention: Array<FlashcardDeckRetention>

    @Field(
        () => [FlashcardRetentionTrendPoint],
        {
            description: "Per-VN-day review retention across the trailing window — the improvement trend.",
        },
    )
        retentionTrend: Array<FlashcardRetentionTrendPoint>
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
