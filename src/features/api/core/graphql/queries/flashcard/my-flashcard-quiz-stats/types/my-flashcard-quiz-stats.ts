/** Params for {@link import("../my-flashcard-quiz-stats.service").MyFlashcardQuizStatsService.compute}. */
export interface ComputeMyFlashcardQuizStatsParams {
    /** Viewer whose quiz stats are being aggregated. */
    userId: string
    /** Course to scope the aggregation to (resolves the same enrollment `startFlashcardQuizSession` draws against). */
    courseId: string
}

/** One technology tag's aggregate coverage across the scanned sessions. */
export interface FlashcardQuizStatsTagItemData {
    /** The technology tag (e.g. "NestJS", "Redis"). */
    tag: string
    /** Aggregate coverage for this tag across every scanned session's cards carrying it, 0..1. */
    coverage: number
}

/** How many of the course's technology tags the learner has attempted at least once, vs how many exist. */
export interface FlashcardQuizStatsConceptCoverageData {
    /** Distinct tags touched by at least one scanned quiz session's cards. */
    covered: number
    /** Distinct tags across every card in this course's decks. */
    total: number
}

/** The viewer's aggregated flashcard quick-quiz stats for one course. */
export interface MyFlashcardQuizStatsResultData {
    /** Whether the viewer has scanned fewer than `MIN_SESSIONS_FOR_STATS` completed quiz sessions -- too little history to show meaningfully. */
    insufficientData: boolean
    /** Per-tag aggregate coverage across the scanned sessions, ranked by coverage descending. */
    byTag: Array<FlashcardQuizStatsTagItemData>
    /** Distinct tags attempted vs distinct tags existing in this course, or null when the course has no tag data at all. */
    conceptCoverage: FlashcardQuizStatsConceptCoverageData | null
}
