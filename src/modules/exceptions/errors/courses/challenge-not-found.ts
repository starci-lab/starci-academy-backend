import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ChallengeNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
}

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
