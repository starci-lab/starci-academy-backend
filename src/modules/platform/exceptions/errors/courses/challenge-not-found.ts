import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Challenge id that did not match any row. */
export interface ChallengeNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
}

/**
 * Fails the request when the challenge id is unknown -- downstream must not grade a ghost
 * challenge.
 */
export class ChallengeNotFoundException extends AbstractException {
    constructor({
        id,
        originalError,
    }: ChallengeNotFoundExceptionMetadata) {
        super(
            "Challenge not found",
            "CHALLENGE_NOT_FOUND_EXCEPTION",
            {
                id,
                originalError,
            },
        )
    }
}
