/** Params for {@link import("../my-flashcard-review-stats.service").MyFlashcardReviewStatsService.compute}. */
export interface ComputeMyFlashcardReviewStatsParams {
    /** Viewer whose review stats are being aggregated. */
    userId: string
    /** Course to scope the aggregation to (resolves the same enrollment `startFlashcardReviewSession` draws against). */
    courseId: string
}

/**
 * One day's review activity in the trailing window — the count of cards
 * graded across ALL of that VN-calendar-day's completed sessions. Zero-filled
 * for days with no activity so the chart reads as a true "did I study each
 * day" consistency view (rest days show as empty bars, not gaps).
 */
export interface FlashcardReviewDailyActivityData {
    /** The VN-calendar day (`YYYY-MM-DD`). */
    date: string
    /** Cards graded across every completed session that day (0 = rest day). */
    cardsReviewed: number
}

/** One deck's aggregate review footprint across the scanned sessions. */
export interface FlashcardReviewStatsDeckItemData {
    /** The deck this aggregate is scoped to. */
    deckId: string
    /** The deck's title. */
    deckTitle: string
    /** Completed review sessions scanned for this deck. */
    sessionCount: number
    /** Total cards graded across every scanned session for this deck. */
    cardsReviewed: number
    /** This deck's current total card count. */
    totalCards: number
}

/** One day's forecasted due-card count, in the trailing 7-day-forward window. */
export interface FlashcardDueForecastPointData {
    /** The VN-calendar day (`YYYY-MM-DD`). */
    date: string
    /** Cards due that day (0 = nothing due). */
    count: number
}

/** The enrollment's card-maturity breakdown, by `repetitions` on `user_flashcard_reviews`. */
export interface FlashcardMasteryBreakdownData {
    /** Cards with `repetitions >= 2` — considered mastered. */
    mastered: number
    /** Cards reviewed at least once but not yet mastered (`repetitions` 0 or 1). */
    learning: number
    /** Cards in the course's decks never yet reviewed. */
    new: number
}

/** The viewer's aggregated flashcard review stats for one course. */
export interface MyFlashcardReviewStatsResultData {
    /** Cards reviewed per VN-day across the trailing window (zero-filled, oldest first). */
    dailyActivity: Array<FlashcardReviewDailyActivityData>
    /** Per-deck aggregate review footprint across the scanned sessions. */
    byDeck: Array<FlashcardReviewStatsDeckItemData>
    /** Cards due for review right now, scoped to the viewer's enrollment. */
    dueToday: number
    /** Cards due per VN-day across the next 7 days (zero-filled, tomorrow first). */
    dueForecast: Array<FlashcardDueForecastPointData>
    /** The viewer's card-maturity breakdown for this course (mastered / learning / new). */
    masteryBreakdown: FlashcardMasteryBreakdownData
}
