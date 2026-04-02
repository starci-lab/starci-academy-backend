import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ChallengeSubmissionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    submissionId?: string
}

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
