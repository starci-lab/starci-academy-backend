import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Challenge index whose path was missing from the resolved `paths` list. */
export interface ChallengePathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    challengeIndex: number
}

/**
 * No challenge path is available in the resolved `paths` list for the given index.
 */
export class ChallengePathNotFoundException extends AbstractException {
    constructor(
        {
            challengeIndex,
            originalError,
        }: ChallengePathNotFoundExceptionMetadata,
    ) {
        super(
            `Challenge path not found for index ${challengeIndex}`,
            "CHALLENGE_PATH_NOT_FOUND_EXCEPTION",
            {
                challengeIndex,
                originalError,
            },
        )
    }
}
