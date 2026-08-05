import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Submission currently executing another attempt. */
export interface SubmissionAlreadyRunningExceptionMetadata extends AbstractExceptionMetadata {
    submissionId: string
}

/** Blocks a second concurrent grade/run so two workers cannot overwrite the same attempt. */
export class SubmissionAlreadyRunningException extends AbstractException {
    constructor({
        submissionId,
        originalError,
    }: SubmissionAlreadyRunningExceptionMetadata) {
        super(
            "A submission is already being processed.",
            "SUBMISSION_ALREADY_RUNNING_EXCEPTION",
            {
                submissionId,
                originalError,
            },
        )
    }
}
