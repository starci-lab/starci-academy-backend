import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link ChallengeContentFKConstraintException}. */
export interface ChallengeContentFKConstraintExceptionMetadata extends AbstractExceptionMetadata {
    /** Challenge row id from the seed payload. */
    challengeId?: string
    /** Content id when partially present on the payload. */
    contentId?: string
}

/**
 * Thrown when a challenge seed row cannot be upserted because the parent content FK is missing.
 */
export class ChallengeContentFKConstraintException extends AbstractException {
    constructor({
        challengeId,
        contentId,
        originalError,
    }: ChallengeContentFKConstraintExceptionMetadata) {
        super(
            "Challenge seed is missing content FK (content.id or contentId)",
            "CHALLENGE_CONTENT_FK_CONSTRAINT_EXCEPTION",
            {
                challengeId,
                contentId,
                originalError,
            },
        )
    }
}
