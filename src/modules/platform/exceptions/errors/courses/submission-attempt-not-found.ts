import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface SubmissionAttemptNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
}

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
