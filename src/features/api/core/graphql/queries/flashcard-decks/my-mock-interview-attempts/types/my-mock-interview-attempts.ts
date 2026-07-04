/** One phase's score breakdown inside a persisted mock-interview attempt. */
export interface MockInterviewAttemptPhaseScore {
    /** One of the 5 canonical mock interview phase literals. */
    phase: string
    /** Score the model assigned to this phase. */
    score: number
    /** Maximum possible score for this phase. */
    max: number
}

/** One named attribute's score breakdown inside a persisted mock-interview attempt. */
export interface MockInterviewAttemptAttributeScore {
    /** The named attribute (e.g. "communication", "structuredThinking", "tradeoffAwareness"). */
    key: string
    /** Score 0–100 the model assigned to this attribute. */
    score: number
}

/** One past graded mock-interview session, for the viewer's history list. */
export interface MockInterviewAttemptSummary {
    /** Attempt row id. */
    id: string
    /** Client-generated id grouping this attempt into its interview run. */
    sessionId: string
    /** The prompt (capstone milestone-task id or a curated classic slug) worked through. */
    promptId: string
    /** Snapshot of the prompt's title at grade time. */
    promptTitle: string
    /** Seniority level the session was graded against, or null (any level). */
    level: string | null
    /** Integer 0–100 overall score. */
    overallScore: number
    /** Coarse pass/borderline/fail band. */
    verdict: string
    /** Per-phase score breakdown. */
    phaseScores: Array<MockInterviewAttemptPhaseScore>
    /** Per-attribute score breakdown. */
    attributeScores: Array<MockInterviewAttemptAttributeScore>
    /** Concrete things done right. */
    strengths: Array<string>
    /** Concrete gaps to address. */
    gaps: Array<string>
    /** A follow-up an interviewer would ask next, or null. */
    followUpQuestion: string | null
    /** When this attempt was graded. */
    createdAt: Date
}

/** Params for {@link import("../my-mock-interview-attempts.service").MyMockInterviewAttemptsService.list}. */
export interface ListMyMockInterviewAttemptsParams {
    /** Viewer whose history is being read. */
    userId: string
    /** Course to scope the history to (mirrors the enrollment the attempts are keyed by). */
    courseId: string
    /** Page size (attempts per page). */
    limit: number
    /** Page offset (attempts to skip). */
    offset: number
}

/** Result of listing a page of the viewer's mock-interview history. */
export interface ListMyMockInterviewAttemptsResult {
    /** Total attempts matching the scope (for pagination), regardless of `limit`/`offset`. */
    totalCount: number
    /** This page's attempts, newest first. */
    items: Array<MockInterviewAttemptSummary>
}
