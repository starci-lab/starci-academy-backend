import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Plan step (LLM) returned no non-whitespace review plan text. */
export interface CvSubmissionPlanEmptyTextExceptionMetadata extends AbstractExceptionMetadata {
    /** CV object key on the submission (for tracing). */
    key: string
}

/** Aborts CV plan when extracted text is empty — the model would plan against nothing. */
export class CvSubmissionPlanEmptyTextException extends AbstractException {
    constructor({
        key,
        originalError,
    }: CvSubmissionPlanEmptyTextExceptionMetadata) {
        super(
            `CV plan: model returned empty review plan (submission key "${key}").`,
            "CV_SUBMISSION_PLAN_EMPTY_TEXT_EXCEPTION",
            {
                key,
                originalError,
            },
        )
    }
}
