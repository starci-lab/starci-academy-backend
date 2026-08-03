import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"
import type {
    SubmissionType,
} from "@modules/databases"

export interface ChallengeSubmissionSubmitTypeNotSupportedExceptionMetadata extends AbstractExceptionMetadata {
    submissionType?: SubmissionType
    challengeSubmissionId?: string
}

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
