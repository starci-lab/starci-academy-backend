import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Submission still inside its retry cooldown window. */
export interface SubmissionCooldownExceptionMetadata extends AbstractExceptionMetadata {
    nextAllowedAt: Date
}

/** Rejects resubmit until cooldown elapses -- prevents hammering the grader. */
export class SubmissionCooldownException extends AbstractException {
    constructor({
        nextAllowedAt,
        originalError,
    }: SubmissionCooldownExceptionMetadata) {
        super(
            "You can only submit once every 3 hours.",
            "SUBMISSION_COOLDOWN_EXCEPTION",
            {
                nextAllowedAt,
                originalError,
            },
        )
    }
}
