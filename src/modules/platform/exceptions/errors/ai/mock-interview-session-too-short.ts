import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for the mock-interview near-empty-session exception. */
export interface MockInterviewSessionTooShortExceptionMetadata extends AbstractExceptionMetadata {
    /** Total characters across the candidate's own turns (excluding the synthetic diagram turn) that failed the minimum. */
    candidateCharCount: number
    /** The minimum required, for tracing/debugging. */
    minRequired: number
}

/**
 * Thrown by `MockInterviewGradingService.grade` BEFORE the AI invoke + credit
 * charge when the candidate's session is too near-empty to be worth grading
 * (e.g. the learner clicked through the interview without answering, or spoke
 * only a few filler words). Guards both fairness (no credit burned on a
 * non-attempt) and signal quality (a near-empty transcript would only ever
 * score "fail" and pollute the rolling job-readiness interview average with a
 * data point that isn't a real attempt).
 */
export class MockInterviewSessionTooShortException extends AbstractException {
    constructor({
        candidateCharCount,
        minRequired,
        originalError,
    }: MockInterviewSessionTooShortExceptionMetadata) {
        super(
            `Mock interview session too short to grade (candidate answers total ${candidateCharCount} chars, minimum ${minRequired}). Hãy trả lời đầy đủ hơn trước khi nộp bài.`, // vn-ok: vi-locale string emitted to clients
            "MOCK_INTERVIEW_SESSION_TOO_SHORT_EXCEPTION",
            {
                candidateCharCount,
                minRequired,
                originalError,
            },
        )
    }
}
