import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link SubmissionQuotaExceededException}. */
export interface SubmissionQuotaExceededExceptionMetadata extends AbstractExceptionMetadata {
    /** Human-readable time the quota resets; null when unknown. */
    waitUntil: string | null
}

/**
 * Thrown at submit time when the user has no grading quota left in the shared
 * credit pool. Replaces the old fixed cooldown.
 */
export class SubmissionQuotaExceededException extends AbstractException {
    constructor({
        waitUntil,
        originalError,
    }: SubmissionQuotaExceededExceptionMetadata) {
        super(
            waitUntil
                ? `You've exceeded your grading quota. Please wait until ${waitUntil}.`
                : "You've exceeded your grading quota. Please wait for it to reset.",
            "SUBMISSION_QUOTA_EXCEEDED_EXCEPTION",
            {
                waitUntil,
                originalError,
            },
        )
    }
}
