import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ChallengeNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    challengeId?: string
}

export class ChallengeNotFoundException extends AbstractException {
    constructor({
        challengeId,
        originalError,
    }: ChallengeNotFoundExceptionMetadata) {
        super(
            "Challenge not found",
            "CHALLENGE_NOT_FOUND_EXCEPTION",
            {
                challengeId,
                originalError,
            },
        )
    }
}
