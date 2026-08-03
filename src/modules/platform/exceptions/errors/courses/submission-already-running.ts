import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface SubmissionAlreadyRunningExceptionMetadata extends AbstractExceptionMetadata {
    submissionId: string
}

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
