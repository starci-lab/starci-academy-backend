import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface UserChallengeSubmissionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    userChallengeSubmissionId?: string
}

export class UserChallengeSubmissionNotFoundException extends AbstractException {
    constructor({
        userChallengeSubmissionId,
        originalError,
    }: UserChallengeSubmissionNotFoundExceptionMetadata) {
        super(
            "User challenge submission not found",
            "USER_CHALLENGE_SUBMISSION_NOT_FOUND_EXCEPTION",
            {
                userChallengeSubmissionId,
                originalError,
            },
        )
    }
}
