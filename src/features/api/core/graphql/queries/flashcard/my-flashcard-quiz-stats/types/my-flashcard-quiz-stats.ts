/** Params for {@link import("../my-flashcard-quiz-stats.service").MyFlashcardQuizStatsService.compute}. */
export interface ComputeMyFlashcardQuizStatsParams {
    /** Viewer whose quiz stats are being aggregated. */
    userId: string
    /** Course to scope the aggregation to (resolves the same enrollment `startFlashcardQuizSession` draws against). */
    courseId: string
}

/** One point on the coverage/XP trend line, oldest-of-the-recent-window first. */
export interface FlashcardQuizStatsTrendPointData {
    /** When the session behind this point completed. */
    completedAt: Date
    /** The session's coverage, 0..1 (0 when never snapshotted). */
    coverage: number
    /** XP granted for the session. */
    xpEarned: number
}

/** One technology tag's aggregate coverage across the scanned sessions. */
export interface FlashcardQuizStatsTagItemData {
    /** The technology tag (e.g. "NestJS", "Redis"). */
    tag: string
    /** Aggregate coverage for this tag across every scanned session's cards carrying it, 0..1. */
    coverage: number
}

/** One tag's most-recent weak-spot occurrence, carrying a study deep-link back to its source module/content. */
export interface FlashcardQuizStatsWeakTagLinkData {
    /** The technology tag (e.g. "NestJS", "Redis"). */
    tag: string
    /** This tag's coverage on its most recent occurrence across the scanned sessions, 0..1. */
    coverage: number
    /** The single module this tag's cards map back to; null when the deck-to-module mapping was ambiguous. */
    moduleId: string | null
    /** The single content (lesson) this tag's cards map back to; null when the deck-to-content mapping was ambiguous. */
    contentId: string | null
}

/** One "hard" quiz card — the quiz analogue of a review leech, lowest per-card coverage first. */
export interface FlashcardQuizStatsHardCardData {
    /** The card id (deep-link target). */
    cardId: string
    /** The card's question text (default-locale snapshot). */
    question: string
    /** Times this card was answered across the scanned quiz sessions (sample size). */
    attempts: number
    /** Times this card was answered with at least one blank wrong (coverage < 1). */
    wrongCount: number
    /** Aggregate coverage for this card = ΣcorrectBlanks / ΣtotalBlanks across attempts, 0..1. */
    coverage: number
    /** Owning deck id (deep-link target). */
    deckId: string
    /** Owning deck title. */
    deckTitle: string
}

/** One deck's aggregate practice footprint across the scanned sessions. */
export interface FlashcardQuizStatsDeckItemData {
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

/** The viewer's aggregated flashcard quick-quiz stats for one course. */
export interface MyFlashcardQuizStatsResultData {
    /** Whether the viewer has scanned fewer than `MIN_SESSIONS_FOR_STATS` completed quiz sessions — too little history to show meaningfully. */
    insufficientData: boolean
    /** Coverage/XP trend across the most recent sessions (bounded, oldest of the window first). */
    trend: Array<FlashcardQuizStatsTrendPointData>
    /** Per-tag aggregate coverage across the scanned sessions, ranked by coverage descending. */
    byTag: Array<FlashcardQuizStatsTagItemData>
    /** Per-deck aggregate practice footprint across the scanned sessions. */
    byDeck: Array<FlashcardQuizStatsDeckItemData>
    /** Weakest tags with a study deep-link, each tag's most recent occurrence, ranked coverage ascending. */
    weakTagLinks: Array<FlashcardQuizStatsWeakTagLinkData>
    /** Cards the learner keeps under-answering (lowest coverage), hardest first — the "câu hay sai" diagnosis. */
    hardCards: Array<FlashcardQuizStatsHardCardData>
    /** Completed quiz sessions scanned — a raw count for the "N phiên" tile. */
    completedSessionCount: number
}
