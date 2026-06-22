/** Params for {@link InterviewHistoryService.getSummary}. */
export interface GetInterviewHistoryParams {
    /** Whose interview attempts to aggregate. */
    userId: string
    /** Optional deck to scope the history to; omit for course-/account-wide history. */
    flashcardDeckId?: string | null
}

/**
 * Aggregated cross-session mock-interview history for a user, derived from the
 * append-only `interview_attempts` log.
 */
export interface InterviewHistorySummary {
    /** Total graded answers in scope. */
    totalAnswered: number
    /** Mean score (0–100) across those answers, rounded to one decimal. */
    averageScore: number
    /** How many answers passed. */
    passCount: number
    /** How many answers were borderline. */
    borderlineCount: number
    /** How many answers failed. */
    failCount: number
    /** Most frequent tags among the answers NOT passed — the topics to revisit. */
    weakTags: Array<string>
    /** Timestamp of the most recent attempt, or null when none. */
    lastAttemptAt: Date | null
}
