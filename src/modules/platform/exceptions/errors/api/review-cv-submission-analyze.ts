import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Analyze step result missing or empty `detailFeedback` when persisting the attempt. */
export interface CvSubmissionAnalyzeEmptyDetailFeedbackExceptionMetadata extends AbstractExceptionMetadata {
    /** CV object key on the submission (for tracing). */
    key: string
}

/**
 * Aborts CV analyze when the model returned no detail feedback -- an empty review must not
 * be stored.
 */
export class CvSubmissionAnalyzeEmptyDetailFeedbackException extends AbstractException {
    constructor({
        key,
        originalError,
    }: CvSubmissionAnalyzeEmptyDetailFeedbackExceptionMetadata) {
        super(
            `CV analyze: empty or missing detail feedback (submission key "${key}").`,
            "CV_SUBMISSION_ANALYZE_EMPTY_DETAIL_FEEDBACK_EXCEPTION",
            {
                key,
                originalError,
            },
        )
    }
}
