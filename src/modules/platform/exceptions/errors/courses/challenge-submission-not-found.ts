import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Submission id that did not match any challenge-submission row. */
export interface ChallengeSubmissionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    submissionId?: string
}

/**
 * Fails review/progress when the submission row is gone — status updates must not invent
 * one.
 */
export class ChallengeSubmissionNotFoundException extends AbstractException {
    constructor({
        submissionId,
        originalError,
    }: ChallengeSubmissionNotFoundExceptionMetadata) {
        super(
            "Challenge submission not found",
            "CHALLENGE_SUBMISSION_NOT_FOUND_EXCEPTION",
            {
                submissionId,
                originalError,
            },
        )
    }
}
