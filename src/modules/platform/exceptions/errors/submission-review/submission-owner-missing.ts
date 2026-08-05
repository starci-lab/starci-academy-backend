import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a graded submission with no `userId` at credit-usage write time. */
export interface SubmissionOwnerMissingExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the challenge submission whose `userId` is null. */
    userChallengeSubmissionId: string
}

/**
 * Thrown when a step needs to record AI credit usage for a graded submission,
 * but the submission's `userId` is null. `user_id` became nullable after the
 * enrollment-centric migration, but an AI-graded submission always has an
 * owner -- this guards the credit-usage write against silently mis-typing.
 */
export class SubmissionOwnerMissingException extends AbstractException {
    constructor({
        userChallengeSubmissionId,
        originalError,
    }: SubmissionOwnerMissingExceptionMetadata) {
        super(
            "Cannot record credit usage: submission has no owner user.",
            "SUBMISSION_OWNER_MISSING_EXCEPTION",
            {
                userChallengeSubmissionId,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
