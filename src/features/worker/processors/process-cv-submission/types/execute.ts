import {
    CVSubmissionAttemptEntity,
    CVSubmissionFeedbackEntity,
} from "@modules/databases"

/** Result of the CV extraction step. */
export interface ProcessCvSubmissionExtractStepExecuteResult {
    /** The extracted text. */
    originalText: string
}

/** Result of the CV analysis step. */
export interface ProcessCvSubmissionAnalyzeStepExecuteResult {
    /** The updated CV submission attempt entity (partial). */
    cvSubmissionAttempt: Partial<CVSubmissionAttemptEntity>
    /** The structured feedback row to insert. */
    cvSubmissionFeedback: Omit<
    CVSubmissionFeedbackEntity,
    "id" | "createdAt" | "updatedAt" | "attempt" | "attemptId"
    >
    /** Quick summary to mirror on the root submission. */
    feedback: string
}
