/**
 * Params for recording a finished flashcard quick-quiz ("Hỏi nhanh") session and
 * granting its capped, idempotent XP reward.
 */
export interface CompleteFlashcardQuizSessionParams {
    /** The learner who finished the session. */
    userId: string
    /** Client-generated session id — the idempotency key (becomes the xp_history refId). */
    sessionId: string
    /** Course the session belongs to (scopes the xp_history course). */
    courseId: string
    /** How many cards were answered in this session (clamped to [0, 10]). */
    answeredCount: number
    /** Aggregate keyword + layer coverage across the session, 0..1 (clamped). */
    coverageScore: number
}

/**
 * Result of recording a finished flashcard quick-quiz session.
 */
export interface CompleteFlashcardQuizSessionResult {
    /** XP granted this call — 0 on an idempotent replay (already recorded). */
    xpEarned: number
}
