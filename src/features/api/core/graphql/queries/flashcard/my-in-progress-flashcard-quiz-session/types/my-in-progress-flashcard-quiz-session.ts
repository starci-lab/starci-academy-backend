/** One synced in-flight card result, read back for a resumable session. */
export interface MyInProgressFlashcardQuizSessionResult {
    /** The flashcard this result belongs to. */
    cardId: string
    /** How many cloze blanks on this card the learner filled correctly so far. */
    correctBlanks: number
    /** Total cloze blanks on this card. */
    totalBlanks: number
}

/** Params for {@link import("../my-in-progress-flashcard-quiz-session.service").MyInProgressFlashcardQuizSessionService.find}. */
export interface FindMyInProgressFlashcardQuizSessionParams {
    /** Viewer whose in-flight session is being looked up. */
    userId: string
    /** Course to scope the lookup to (resolves the same enrollment `startFlashcardQuizSession` draws against). */
    courseId: string
}

/**
 * The learner's most recent RESUMABLE flashcard quick-quiz session for one
 * course — "resume flashcard quiz session" (2026-07-08). Null when there is
 * none (no draw was ever left in-flight, the last draw already
 * completed/was abandoned, or the last sync is older than the resume window).
 */
export interface MyInProgressFlashcardQuizSessionResultData {
    /** Id of the persisted session — pass to `syncFlashcardQuizSessionProgress` / `completeFlashcardQuizSession`. */
    sessionId: string
    /** The flashcard_cards.id set drawn for this session, in ask order. */
    cardIds: Array<string>
    /** 0-based index of the card the learner was on at the last sync. */
    currentIndex: number
    /** The synced per-card results so far — empty when no sync has happened yet. */
    results: Array<MyInProgressFlashcardQuizSessionResult>
    /** When this session was last synced/updated. */
    updatedAt: Date
    /** When the persisted session row was drawn — the anchor for the session's lazy-expiry deadline (createdAt + `FLASHCARD_QUIZ_SESSION_DURATION_MS`), so a RESUMED session's countdown reflects the true remaining time, not a freshly-reset window. */
    createdAt: Date
}
