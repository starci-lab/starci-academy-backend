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

/** One "hard" quiz card — a card the learner keeps under-answering (lowest per-card coverage), the quiz analogue of a review leech. */
export interface FlashcardQuizHardCardData {
    /** The card id (deep-link target). */
    cardId: string
    /** The card's question text (default-locale snapshot). */
    question: string
    /** Times this card was answered across the scanned quiz sessions (sample size). */
    attempts: number
    /** Times this card was answered with at least one blank wrong (coverage < 1). */
    wrongCount: number
    /** Aggregate coverage for this card = ΣcorrectBlanks / ΣtotalBlanks across attempts, 0..1 (ranking key). */
    coverage: number
    /** Owning deck id (deep-link target). */
    deckId: string
    /** Owning deck title (default-locale snapshot). */
    deckTitle: string
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

/** One "leech" card — a card the learner keeps grading Again (forgetting), most-forgotten first. */
export interface FlashcardLeechCardData {
    /** The card id (open it in the reviewer). */
    cardId: string
    /** The card's question text (default-locale snapshot — the reviewer re-localizes on open). */
    question: string
    /** How many times this card was graded Again (grade 0) across the scanned event window. */
    forgotCount: number
    /** Owning deck id (deep-link target). */
    deckId: string
    /** Owning deck title (default-locale snapshot). */
    deckTitle: string
}

/** The single weakest technology tag by review retention (lowest recalled/total), or null when none qualifies. */
export interface FlashcardWeakReviewTagData {
    /** The technology tag (e.g. "NestJS"). */
    tag: string
    /** Retention for this tag = graded Good/Easy (>=2) / total graded, 0..100. */
    retention: number
    /** Total graded reviews of cards carrying this tag (sample size). */
    reviewCount: number
}

/** One deck's REVIEW retention (recalled/total), the outcome analogue of the footprint `reviewByDeck`. */
export interface FlashcardDeckRetentionData {
    /** The deck this retention is scoped to. */
    deckId: string
    /** The deck's title. */
    deckTitle: string
    /** Retention = graded Good/Easy (>=2) / total graded for this deck's cards, 0..100. */
    retention: number
    /** Total graded reviews for this deck's cards (sample size). */
    reviewCount: number
}

/** One VN-day's review retention — powers the "đang cải thiện?" trend line. */
export interface FlashcardRetentionTrendPointData {
    /** The VN-calendar day (`YYYY-MM-DD`). */
    date: string
    /** Retention that day = recalled/total, 0..100. */
    retention: number
    /** Reviews graded that day (sample size; 0 = no reviews, retention 0). */
    reviewCount: number
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
    /** Cards the learner keeps under-answering in quizzes (lowest coverage), hardest first, bounded — the "câu hay sai" diagnosis. */
    quizHardCards: Array<FlashcardQuizHardCardData>
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
    /** Cards the learner keeps forgetting (grade Again), most-forgotten first, bounded — the "cần ôn lại" hero. */
    leechCards: Array<FlashcardLeechCardData>
    /** The single weakest tag by review retention, or null when none has enough samples. */
    weakReviewTag: FlashcardWeakReviewTagData | null
    /** Per-deck review RETENTION (outcome), weakest first — the outcome analogue of `reviewByDeck` footprint. */
    deckRetention: Array<FlashcardDeckRetentionData>
    /** Per-VN-day review retention across the trailing window — the "đang cải thiện?" trend. */
    retentionTrend: Array<FlashcardRetentionTrendPointData>
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
