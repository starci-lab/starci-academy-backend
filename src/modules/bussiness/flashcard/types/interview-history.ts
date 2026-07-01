/** Params for {@link InterviewHistoryService.getSummary}. */
export interface GetInterviewHistoryParams {
    /** Whose interview attempts to aggregate. */
    userId: string
    /** Optional deck to scope the history to (takes precedence over `courseId`). */
    flashcardDeckId?: string | null
    /** Optional course to scope the history to (random-interview mode = course-wide). */
    courseId?: string | null
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
    /** Best (highest) score across those answers; 0 when none. */
    bestScore: number
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

/** Params for {@link InterviewHistoryService.getSessions}. */
export interface GetInterviewSessionsParams {
    /** Whose interview runs to list. */
    userId: string
    /** Optional deck to scope to (takes precedence over `courseId`). */
    flashcardDeckId?: string | null
    /** Optional course to scope to (random-interview mode = course-wide). */
    courseId?: string | null
    /** Page size (sessions per page). */
    limit: number
    /** Page offset (sessions to skip). */
    offset: number
}

/**
 * One interview RUN (5/10 questions answered in a single session), aggregated
 * from the `interview_attempts` rows that share an `interview_session_id`.
 */
export interface InterviewSessionSummary {
    /** The shared session id (client-generated at run start). */
    sessionId: string
    /** When the run started (the earliest attempt in the session). */
    startedAt: Date
    /** How many questions were answered in the run. */
    questionCount: number
    /** Mean score (0–100) across the run, rounded to one decimal. */
    averageScore: number
    /** Best (highest) score in the run. */
    bestScore: number
    /** How many answers passed. */
    passCount: number
    /** How many answers were borderline. */
    borderlineCount: number
    /** How many answers failed. */
    failCount: number
    /** Dominant seniority level across the run's questions, or null when none. */
    level: string | null
}

/** A page of interview runs plus the total run count for pagination. */
export interface InterviewSessionsPage {
    /** The runs on this page, newest first. */
    items: Array<InterviewSessionSummary>
    /** Total number of runs in scope (for pagination). */
    totalCount: number
}

/** Params for {@link InterviewHistoryService.getSessionAttempts}. */
export interface GetInterviewSessionAttemptsParams {
    /** Whose attempts to read. */
    userId: string
    /** Optional deck scope (takes precedence over `courseId`). */
    flashcardDeckId?: string | null
    /** Optional course scope. */
    courseId?: string | null
    /** The run (session) whose answers to list. */
    sessionId: string
}

/** One answered question within a run, with its grade + persisted feedback. */
export interface InterviewSessionAttempt {
    /** Attempt id. */
    id: string
    /** Integer 0–100 score. */
    score: number
    /** Coarse verdict band (pass/borderline/fail). */
    verdict: string
    /** Seniority level of the question, or null. */
    level: string | null
    /** Technology tags of the question. */
    tags: Array<string>
    /** The question prompt (joined from the card). */
    question: string
    /** Concrete strengths (empty for legacy rows). */
    strengths: Array<string>
    /** Concrete gaps (empty for legacy rows). */
    gaps: Array<string>
    /** One-line nudge toward the model answer, or null. */
    modelAnswerHint: string | null
    /** When the answer was graded. */
    createdAt: Date
}
