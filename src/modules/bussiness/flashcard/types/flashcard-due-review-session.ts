/**
 * Params for starting (or resume-replacing) ONE resumable CROSS-DECK
 * due-review batch session for a course.
 */
export interface StartFlashcardDueReviewSessionParams {
    /** The learner starting the draw. */
    userId: string
    /** The course this due-review batch belongs to — resolves the enrollment the session is anchored to. */
    courseId: string
    /** The `flashcard_cards.id` set drawn for this batch (across decks), in the order they will be asked. */
    cardIds: Array<string>
}

/** Result of persisting a new resumable due-review batch session. */
export interface StartFlashcardDueReviewSessionResult {
    /** Id of the persisted session — pass to `syncFlashcardDueReviewSessionProgress` / `completeFlashcardDueReviewSession`. */
    sessionId: string
}

/** Params for syncing an in-flight due-review batch session's position/progress. */
export interface SyncFlashcardDueReviewSessionProgressParams {
    /** The learner the session belongs to (ownership check). */
    userId: string
    /** Id of the session to sync. */
    sessionId: string
    /** 0-based index of the card the learner is currently on. */
    currentIndex: number
    /** Cards actually graded so far this batch (via `reviewFlashcard`). */
    reviewedCount: number
    /**
     * 0-indexed card positions graded this batch (order-independent) — drives
     * the FE per-segment green, distinct from the plain `reviewedCount`.
     * Optional: when omitted the column is left unchanged (same tolerance the
     * sync already has); when provided it overwrites the row's set.
     */
    gradedIndexes?: Array<number>
    /** Client-reported XP bookkeeping snapshot so far this batch (no server grant — see {@link CompleteFlashcardDueReviewSessionParams}). */
    xpEarned: number
}

/** Result of one sync attempt. */
export interface SyncFlashcardDueReviewSessionProgressResult {
    /** Whether the sync was applied — false when the session is not found/owned, or is no longer "in_progress". */
    success: boolean
}

/**
 * Params for recording a finished due-review batch session.
 *
 * `reviewFlashcard` (the per-card SM-2 grading mutation) grants no XP today
 * and writes no `xp_histories` row — so, like `completeFlashcardReviewSession`,
 * this does NOT compute or grant any XP. `xpEarned` here is purely the
 * client-reported bookkeeping snapshot to persist onto the row for
 * history/stats display; it is never used to write `xp_histories` and never
 * double-grants anything.
 */
export interface CompleteFlashcardDueReviewSessionParams {
    /** The learner who finished the batch (ownership check). */
    userId: string
    /** Id of the session to complete. */
    sessionId: string
    /** Final reviewed-card count to snapshot onto the row. */
    reviewedCount: number
    /** Final XP bookkeeping snapshot to persist onto the row (NOT granted server-side — see class doc). */
    xpEarned: number
}

/** Result of recording a finished due-review batch session. */
export interface CompleteFlashcardDueReviewSessionResult {
    /** The reviewed-card count snapshotted onto the row. */
    reviewedCount: number
    /** The XP bookkeeping value snapshotted onto the row (echoed back, not a server grant). */
    xpEarned: number
}

/** Params for looking up the learner's resumable in-progress due-review batch session for one course. */
export interface FindMyInProgressFlashcardDueReviewSessionParams {
    /** Viewer whose in-flight session is being looked up. */
    userId: string
    /** Course to scope the lookup to (resolves the same enrollment `startFlashcardDueReviewSession` draws against). */
    courseId: string
}

/**
 * The learner's most recent RESUMABLE due-review batch session for one
 * course. Null when there is none (no draw was ever left in-flight, the last
 * draw already completed/was abandoned, or the last sync is older than the
 * resume window).
 */
export interface MyInProgressFlashcardDueReviewSessionResultData {
    /** Id of the persisted session — pass to `syncFlashcardDueReviewSessionProgress` / `completeFlashcardDueReviewSession`. */
    sessionId: string
    /** The `flashcard_cards.id` set drawn for this batch, in ask order. */
    cardIds: Array<string>
    /** 0-based index of the card the learner was on at the last sync. */
    currentIndex: number
    /** Cards actually graded so far this batch. */
    reviewedCount: number
    /** 0-indexed card positions graded this batch (order-independent) — rehydrates the FE per-segment green on resume. */
    gradedIndexes: Array<number>
    /** Client-reported XP bookkeeping snapshot so far this batch. */
    xpEarned: number
    /** When this session was last synced/updated. */
    updatedAt: Date
}

/** Params for looking up a due-review batch session directly by its id (ownership-checked). */
export interface FindFlashcardDueReviewSessionByIdParams {
    /** Viewer whose session this must belong to (ownership check). */
    userId: string
    /** Id of the session to look up. */
    sessionId: string
}
