/** Params for {@link import("../my-flashcard-review-history.service").MyFlashcardReviewHistoryService.list}. */
export interface FindMyFlashcardReviewHistoryParams {
    /** Viewer whose review history is being looked up. */
    userId: string
    /** Course to scope the lookup to (resolves the same enrollment `reviewFlashcard`/`startFlashcardReviewSession` draws against). */
    courseId: string
    /** Page size (sessions per page). */
    limit: number
    /** Page offset (sessions to skip). */
    offset: number
}

/** One completed flashcard review session, as read back for the viewer's history. */
export interface MyFlashcardReviewHistoryItemData {
    /** The session's persisted id. */
    id: string
    /** When this session was last updated (its completion time). */
    updatedAt: Date
    /** The deck this session reviewed. */
    deckId: string
    /** The deck's title. */
    deckTitle: string
    /** How many cards this session's deck snapshot carried. */
    cardCount: number
    /** Cards actually graded this session. */
    reviewedCount: number
    /** XP bookkeeping snapshot for this session (not a server grant). */
    xpEarned: number
}

/** A page of the viewer's completed flashcard review sessions + the total count for pagination. */
export interface MyFlashcardReviewHistoryResultData {
    /** Total completed sessions for this (viewer, course), independent of pagination. */
    totalCount: number
    /** The requested page of sessions, newest first. */
    items: Array<MyFlashcardReviewHistoryItemData>
}
