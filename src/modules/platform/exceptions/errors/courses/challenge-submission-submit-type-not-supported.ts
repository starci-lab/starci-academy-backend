import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"
import type {
    SubmissionType,
} from "@modules/databases"

/** Submission type + id that cannot use automated git grading. */
export interface ChallengeSubmissionSubmitTypeNotSupportedExceptionMetadata extends AbstractExceptionMetadata {
    submissionType?: SubmissionType
    challengeSubmissionId?: string
}

/**
 * Rejects auto-grade submit unless the submission is a GitHub repo -- other types need a
 * different pipeline.
 */
export class ChallengeSubmissionSubmitTypeNotSupportedException extends AbstractException {
    constructor({
        submissionType,
        challengeSubmissionId,
        originalError,
    }: ChallengeSubmissionSubmitTypeNotSupportedExceptionMetadata) {
        super(
            "Automated grading submit is only supported for GitHub repository submissions",
            "CHALLENGE_SUBMISSION_SUBMIT_TYPE_NOT_SUPPORTED_EXCEPTION",
            {
                submissionType,
                challengeSubmissionId,
                originalError,
            },
        )
    }
}
