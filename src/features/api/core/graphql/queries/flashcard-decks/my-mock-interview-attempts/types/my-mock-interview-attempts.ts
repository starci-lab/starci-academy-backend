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

/**
 * One persisted per-question model-answer review inside a mock-interview
 * attempt — the read-back shape mirrors
 * {@link import("../../../../mutations/interview/grade-mock-interview-session/types/mock-interview-grade").MockInterviewQuestionReview}
 * exactly (same fields, same jsonb-round-tripped shape) so the history
 * drawer renders it identically to the live scorecard. Always empty for a
 * `mode="design"` attempt.
 */
export interface MockInterviewAttemptQuestionReview {
    /** 0-based index of this question within the session. */
    questionIndex: number
    /** This question's cognitive frame ("theory" | "reasoning" | "scenario"), as drawn. */
    kind: string
    /** The interviewer's question text for this question. */
    question: string
    /** The candidate's own answer for this question. */
    candidateAnswer: string
    /** The seed flashcard's authored model answer (Markdown); null when unavailable. */
    modelAnswer: string | null
    /** A one-line summary of what the candidate's answer was missing relative to the reference. */
    feedback: string
    /** Score assigned to this question. */
    score: number
    /** Maximum possible score for this question (always 100 for qna). */
    max: number
    /** Best-effort matched course content (lesson) id for this question; null when no confident match exists. */
    matchedContentId: string | null
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
    /** The top-level flow this session ran ("qna" | "design"), or null for an attempt graded before the "mode split" (treated as "design" by every reader). */
    mode: string | null
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
    /**
     * Distinct content (lesson) ids the RAG grounding excerpt was retrieved
     * from at grade time (snapshot), in similarity order. Empty when
     * retrieval missed/failed/index absent at grade time, or for attempts
     * graded before this field existed.
     */
    matchedContentIds: Array<string>
    /**
     * Per-question model-answer review — one entry per `mode="qna"`
     * question. Always empty for a `mode="design"` attempt, or an attempt
     * graded before this field existed.
     */
    questionReviews: Array<MockInterviewAttemptQuestionReview>
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
    /**
     * Optional mode filter ("qna" | "design"); omitted = every mode. Filtering
     * to "design" also matches a null-mode legacy attempt (predates the "mode
     * split" — the only mode that could have existed then), mirroring how
     * every other reader treats a null mode.
     */
    mode?: string
}

/** Result of listing a page of the viewer's mock-interview history. */
export interface ListMyMockInterviewAttemptsResult {
    /** Total attempts matching the scope (for pagination), regardless of `limit`/`offset`. */
    totalCount: number
    /** This page's attempts, newest first. */
    items: Array<MockInterviewAttemptSummary>
}
