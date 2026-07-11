/**
 * Params for starting (or resume-replacing) ONE resumable flashcard reviewer
 * ("Học thẻ") session over a single deck.
 */
export interface StartFlashcardReviewSessionParams {
    /** The learner starting the draw. */
    userId: string
    /** The deck this session reviews — review sessions are scoped to ONE deck. */
    deckId: string
    /** The `flashcard_cards.id` set for this deck, in the order they will be reviewed. */
    cardIds: Array<string>
}

/** Result of persisting a new resumable flashcard review session. */
export interface StartFlashcardReviewSessionResult {
    /** Id of the persisted session — pass to `syncFlashcardReviewSessionProgress` / `completeFlashcardReviewSession`. */
    sessionId: string
}

/** Params for syncing an in-flight flashcard review session's position/progress. */
export interface SyncFlashcardReviewSessionProgressParams {
    /** The learner the session belongs to (ownership check). */
    userId: string
    /** Id of the session to sync. */
    sessionId: string
    /** 0-based index of the card the learner is currently on. */
    currentIndex: number
    /** Cards actually graded so far this session (via `reviewFlashcard`). */
    reviewedCount: number
    /** Client-reported XP bookkeeping snapshot so far this session (no server grant — see {@link CompleteFlashcardReviewSessionParams}). */
    xpEarned: number
}

/** Result of one sync attempt. */
export interface SyncFlashcardReviewSessionProgressResult {
    /** Whether the sync was applied — false when the session is not found/owned, or is no longer "in_progress". */
    success: boolean
}

/**
 * Params for recording a finished flashcard review session.
 *
 * `reviewFlashcard` (the per-card SM-2 grading mutation) grants no XP today
 * and writes no `xp_histories` row — so, unlike `completeFlashcardQuizSession`,
 * this does NOT compute or grant any XP. `xpEarned` here is purely the
 * client-reported bookkeeping snapshot to persist onto the row for
 * history/stats display; it is never used to write `xp_histories` and never
 * double-grants anything.
 */
export interface CompleteFlashcardReviewSessionParams {
    /** The learner who finished the session (ownership check). */
    userId: string
    /** Id of the session to complete. */
    sessionId: string
    /** Final reviewed-card count to snapshot onto the row. */
    reviewedCount: number
    /** Final XP bookkeeping snapshot to persist onto the row (NOT granted server-side — see class doc). */
    xpEarned: number
}

/** Result of recording a finished flashcard review session. */
export interface CompleteFlashcardReviewSessionResult {
    /** The reviewed-card count snapshotted onto the row. */
    reviewedCount: number
    /** The XP bookkeeping value snapshotted onto the row (echoed back, not a server grant). */
    xpEarned: number
}

/** Params for looking up the learner's resumable in-progress review session for one deck. */
export interface FindMyInProgressFlashcardReviewSessionParams {
    /** Viewer whose in-flight session is being looked up. */
    userId: string
    /** Deck to scope the lookup to. */
    deckId: string
}

/**
 * The learner's most recent RESUMABLE flashcard review session for one deck.
 * Null when there is none (no draw was ever left in-flight, the last draw
 * already completed/was abandoned, or the last sync is older than the resume
 * window).
 */
export interface MyInProgressFlashcardReviewSessionResultData {
    /** Id of the persisted session — pass to `syncFlashcardReviewSessionProgress` / `completeFlashcardReviewSession`. */
    sessionId: string
    /** The `flashcard_cards.id` set for this deck, in review order. */
    cardIds: Array<string>
    /** 0-based index of the card the learner was on at the last sync. */
    currentIndex: number
    /** Cards actually graded so far this session. */
    reviewedCount: number
    /** Client-reported XP bookkeeping snapshot so far this session. */
    xpEarned: number
    /** When this session was last synced/updated. */
    updatedAt: Date
}

/** Params for looking up a review session directly by its id (ownership-checked, no deckId needed upfront). */
export interface FindFlashcardReviewSessionByIdParams {
    /** Viewer whose session this must belong to (ownership check). */
    userId: string
    /** Id of the session to look up. */
    sessionId: string
}

/**
 * A review session found by id, with its deck identity attached — so the FE's
 * unified `/review/sessions/[sessionId]` route can resolve full context
 * (which deck, its title) from the id ALONE, no `deckId` carried in the URL
 * (thầy 2026-07-11: "ý là không cần &deckId ấy, session đã persist hết rồi").
 */
export interface FlashcardReviewSessionByIdResultData extends MyInProgressFlashcardReviewSessionResultData {
    /** The deck this session reviews. */
    deckId: string
    /** The deck's display title (for the work-session header identity). */
    deckTitle: string
}
