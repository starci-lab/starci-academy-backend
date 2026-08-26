import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Authored and saved deliverable counts retained when whole-attempt validation fails. */
export interface ChallengeSubmissionCollectionIncompleteExceptionMetadata extends AbstractExceptionMetadata {
    challengeId: string
    expectedCount: number
    completeCount: number
}

/** Rejects partial Challenge attempts before any immutable attempt or grading job is created. */
export class ChallengeSubmissionCollectionIncompleteException extends AbstractException {
    constructor({
        challengeId,
        expectedCount,
        completeCount,
        originalError,
    }: ChallengeSubmissionCollectionIncompleteExceptionMetadata) {
        super(
            "Every authored Challenge deliverable must be saved before submitting the attempt",
            "CHALLENGE_SUBMISSION_COLLECTION_INCOMPLETE_EXCEPTION",
            {
                challengeId,
                expectedCount,
                completeCount,
                originalError,
            },
        )
    }
}
