/** Params for {@link import("../my-flashcard-quiz-history.service").MyFlashcardQuizHistoryService.list}. */
export interface FindMyFlashcardQuizHistoryParams {
    /** Viewer whose quiz history is being looked up. */
    userId: string
    /** Course to scope the lookup to (resolves the same enrollment `startFlashcardQuizSession` draws against). */
    courseId: string
    /** Page size (sessions per page). */
    limit: number
    /** Page offset (sessions to skip). */
    offset: number
}

/** One weak tag on a past completed session — same shape `completeFlashcardQuizSession` returns. */
export interface MyFlashcardQuizHistoryWeakTagData {
    /** The technology tag (e.g. "NestJS", "Redis") this coverage is scoped to. */
    tag: string
    /** This tag's coverage across the session's cards carrying it, 0..1. */
    coverage: number
    /** The single module this tag's cards map back to; omitted when the deck-to-module mapping is ambiguous. */
    moduleId?: string
    /** The single content (lesson) this tag's cards map back to; omitted when the deck-to-content mapping is ambiguous. */
    contentId?: string
}

/** One completed flashcard quick-quiz session, as read back for the viewer's history. */
export interface MyFlashcardQuizHistoryItemData {
    /** The session's persisted id. */
    id: string
    /** When this session was last updated (its completion time). */
    updatedAt: Date
    /** Practice mode chosen at setup ("quick" | "deep"). */
    mode: string
    /** Seniority level filter chosen at setup, or null for "all levels". */
    level: string | null
    /** How many cards this session drew. */
    cardCount: number
    /** How many cards the learner got FULLY correct (all cloze blanks right) — the discrete score (correctCount/cardCount). */
    correctCount: number
    /** The session's server-derived aggregate coverage (0..1), or null if never completed with a coverage snapshot. */
    coverage: number | null
    /** XP granted for this session (post daily-cap clamp). */
    xpEarned: number
    /** This session's weakest-coverage tags, snapshotted at completion. */
    weakTags: Array<MyFlashcardQuizHistoryWeakTagData>
}

/** A page of the viewer's completed flashcard quick-quiz sessions + the total count for pagination. */
export interface MyFlashcardQuizHistoryResultData {
    /** Total completed sessions for this (viewer, course), independent of pagination. */
    totalCount: number
    /** The requested page of sessions, newest first. */
    items: Array<MyFlashcardQuizHistoryItemData>
}
