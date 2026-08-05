/**
 * One card's outcome within a finished flashcard quick-quiz
 * session, as reported by the client. The server re-derives the session's
 * aggregate coverage/answered-count from this per-card breakdown instead of
 * trusting a client-sent aggregate -- a scripted caller can no longer just
 * claim `coverageScore: 1.0` on repeat.
 */
export interface QuizSessionAnswerParams {
    /** The flashcard this answer belongs to. */
    cardId: string
    /** How many cloze blanks on this card the learner filled correctly. */
    correctBlanks: number
    /** Total cloze blanks on this card (the denominator for this card's coverage). */
    totalBlanks: number
}

/**
 * Params for recording a finished flashcard quick-quiz session and
 * granting its capped, idempotent XP reward.
 */
export interface CompleteFlashcardQuizSessionParams {
    /** The learner who finished the session. */
    userId: string
    /**
     * Session id -- the idempotency key (becomes the `xp_history` refId).
     * "Resume flashcard quiz session" (2026-07-08): for a session started via
     * `startFlashcardQuizSession`, this is now the SERVER-ISSUED
     * `flashcard_quiz_sessions.id` (not a client-generated uuid) -- completing
     * also flips that row to "completed" (ownership-scoped to this `userId`,
     * a no-op for an id that does not match any owned in-progress row, e.g.
     * an older client that never started a resumable draft).
     */
    sessionId: string
    /** Course the session belongs to (scopes the xp_history course + daily cap). */
    courseId: string
    /** Per-card breakdown this session answered -- the source of truth for scoring. */
    answers: Array<QuizSessionAnswerParams>
}

/**
 * One weak tag surfaced from a finished session -- the lowest-coverage technology
 * tags across the session's cards, ranked ascending (weakest first), so the
 * recap can bridge a poor score back into "review this lesson" instead of a
 * dead-end loop.
 */
export interface QuizSessionWeakTagResult {
    /** The technology tag (e.g. "NestJS", "Redis") this coverage is scoped to. */
    tag: string
    /** This tag's coverage across the session's cards carrying it, 0..1. */
    coverage: number
    /**
     * The single module this tag's cards map back to, when the owning deck(s)
     * reference EXACTLY one module -- omitted when the mapping is ambiguous
     * (deck references zero or multiple modules) so the FE can fall back to a
     * generic course-content link instead of a fabricated deep link.
     */
    moduleId?: string
    /**
     * The single content (lesson) this tag's cards map back to, when the
     * owning deck(s) reference EXACTLY one content -- same ambiguity rule as
     * {@link moduleId}.
     */
    contentId?: string
}

/**
 * A light-touch signal for whether the learner looks ready to try the
 * real, AI-graded Mock Interview -- a cheap proxy (flashcard retention rate)
 * reused as-is rather than new cross-session tracking.
 */
export interface QuizSessionReadinessResult {
    /** The proxy signal used for readiness -- the viewer's flashcard retention rate, 0-100. */
    currentAvg: number
    /** The retention-rate threshold at/above which the cross-link to Mock Interview unlocks. */
    threshold: number
    /** Whether `currentAvg` has reached `threshold`. */
    unlocked: boolean
}

/**
 * Raw-SQL sum row for "XP already granted today from this source" -- a Postgres
 * `SUM(...)` aggregate comes back as `string`, so this stays a string field
 * even though it is numeric data.
 */
export interface QuizXpSumRow {
    /** `COALESCE(SUM(amount), 0)` as text (Postgres numeric aggregate wire format). */
    sum: string
}

/**
 * Result of recording a finished flashcard quick-quiz session.
 */
export interface CompleteFlashcardQuizSessionResult {
    /** XP granted this call -- 0 on an idempotent replay (already recorded) or a fully-capped day. */
    xpEarned: number
    /** True when the daily XP cap for this (user, course, FlashcardQuiz) was already reached before this grant. */
    dailyCapReached: boolean
    /** Weakest-coverage tags this session, ranked ascending, capped at 5 -- empty when the session answered nothing. */
    weakTags: Array<QuizSessionWeakTagResult>
    /** Readiness signal for the AI Mock Interview cross-link. */
    readiness: QuizSessionReadinessResult
}
