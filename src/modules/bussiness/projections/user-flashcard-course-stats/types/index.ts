import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing one enrollment's flashcard-course-stats projection row. */
export interface RecomputeUserFlashcardCourseStatsParams {
    /** The enrollment (user × course) whose flashcard stats to rebuild. */
    enrollmentId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** Params for reading one enrollment's flashcard-course stats. */
export interface UserFlashcardCourseStatsParams {
    /** The enrollment whose flashcard stats to read. */
    enrollmentId: string
}

/** One point on the quick-quiz coverage/XP trend line, oldest-of-the-recent-window first. */
export interface FlashcardQuizTrendPointData {
    /** When the session behind this point completed. */
    completedAt: Date
    /** The session's coverage, 0..1 (0 when never snapshotted). */
    coverage: number
    /** XP granted for the session. */
    xpEarned: number
}

/** One technology tag's aggregate quiz coverage across the scanned sessions. */
export interface FlashcardQuizTagStatData {
    /** The technology tag (e.g. "NestJS", "Redis"). */
    tag: string
    /** Aggregate coverage for this tag across every scanned session's cards carrying it, 0..1. */
    coverage: number
}

/** One tag's most-recent weak-spot occurrence, carrying a study deep-link back to its source module/content. */
export interface FlashcardQuizWeakTagLinkData {
    /** The technology tag (e.g. "NestJS", "Redis"). */
    tag: string
    /** This tag's coverage on its most recent occurrence across the scanned sessions, 0..1. */
    coverage: number
    /** The single module this tag's cards map back to; null when the deck-to-module mapping was ambiguous. */
    moduleId: string | null
    /** The single content (lesson) this tag's cards map back to; null when the deck-to-content mapping was ambiguous. */
    contentId: string | null
}

/** One deck's aggregate quiz practice footprint across the scanned sessions. */
export interface FlashcardDeckStatData {
    /** The deck this aggregate is scoped to. */
    deckId: string
    /** The deck's title. */
    deckTitle: string
    /** Distinct scanned sessions that touched this deck (a deck answered twice in one session still counts once). */
    sessionCount: number
    /** Total card-answers (not unique cards) touching this deck across the scanned sessions. */
    cardsAnswered: number
    /** This deck's total card count. */
    totalCards: number
}

/** One deck's aggregate review footprint across the scanned sessions. */
export interface FlashcardReviewDeckStatData {
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

/**
 * The full flashcard-course-stats aggregate for one enrollment — shared by
 * BOTH the quick-quiz (`quizTrend`/`quizByTag`/`quizByDeck`) and review
 * (`reviewByDeck`/`dueToday`/`dueForecast`/`masteryBreakdown`) recap surfaces.
 */
export interface UserFlashcardCourseStatsResult {
    /** Quick-quiz coverage/XP trend across the most recent sessions (bounded, oldest of the window first). */
    quizTrend: Array<FlashcardQuizTrendPointData>
    /** Per-tag aggregate quiz coverage across the scanned sessions, ranked by coverage descending. */
    quizByTag: Array<FlashcardQuizTagStatData>
    /** Per-deck aggregate quiz practice footprint across the scanned sessions. */
    quizByDeck: Array<FlashcardDeckStatData>
    /** Weakest tags with a study deep-link, each tag's MOST RECENT occurrence, ranked coverage ascending. */
    weakTagLinks: Array<FlashcardQuizWeakTagLinkData>
    /** Completed quiz sessions scanned (bounded by the service's session-scan cap) — drives the insufficient-data gate. */
    completedSessionCount: number
    /** Per-deck aggregate review footprint across the scanned sessions. */
    reviewByDeck: Array<FlashcardReviewDeckStatData>
    /** Cards due for review right now (`due_at <= now()`), scoped to this enrollment. */
    dueToday: number
    /** Cards due per VN-day across the next 7 days (zero-filled, tomorrow first). */
    dueForecast: Array<FlashcardDueForecastPointData>
    /** The enrollment's card-maturity breakdown (mastered / learning / new). */
    masteryBreakdown: FlashcardMasteryBreakdownData
}

/**
 * CDC row from either `flashcard_quiz_sessions` or `flashcard_review_sessions`
 * — both carry `enrollment_id` directly, no join needed to derive the
 * recompute target.
 */
export interface FlashcardCourseStatsSourceCdcRow {
    /** The enrollment this session row belongs to. */
    enrollment_id?: string
}
