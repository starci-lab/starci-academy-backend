import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface SubmissionCooldownExceptionMetadata extends AbstractExceptionMetadata {
    nextAllowedAt: Date
}

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
