import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Attempt id that matched no submission-attempt row. */
export interface SubmissionAttemptNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
}

/** Fails attempt-scoped reads when the attempt row is gone. */
export class SubmissionAttemptNotFoundException extends AbstractException {
    constructor({
        id,
        originalError,
    }: SubmissionAttemptNotFoundExceptionMetadata) {
        super(
            "Submission attempt not found",
            "SUBMISSION_ATTEMPT_NOT_FOUND_EXCEPTION",
            {
                id,
                originalError,
            },
        )
    }
}
