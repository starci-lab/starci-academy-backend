import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface UserChallengeSubmissionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    userChallengeSubmissionId?: string
    /** `challenge_submissions.id` when the join row is missing for this user. */
    challengeSubmissionId?: string
    userId?: string
}

export class UserChallengeSubmissionNotFoundException extends AbstractException {
    constructor({
        userChallengeSubmissionId,
        challengeSubmissionId,
        userId,
        originalError,
    }: UserChallengeSubmissionNotFoundExceptionMetadata) {
        super(
            "User challenge submission not found",
            "USER_CHALLENGE_SUBMISSION_NOT_FOUND_EXCEPTION",
            {
                userChallengeSubmissionId,
                challengeSubmissionId,
                userId,
                originalError,
            },
        )
    }
}
