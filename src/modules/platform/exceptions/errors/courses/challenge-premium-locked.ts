import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link ChallengePremiumLockedException}. */
export interface ChallengePremiumLockedExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the premium content that owns the blocked challenge. */
    contentId: string
}

/**
 * Thrown when a learner opens or attempts a challenge whose owning content is
 * premium without being enrolled in the owning course. Free content's
 * challenges are open to everyone; a trial row does not count as enrollment.
 */
export class ChallengePremiumLockedException extends AbstractException {
    constructor({
        contentId,
        originalError,
    }: ChallengePremiumLockedExceptionMetadata) {
        super(
            "This challenge is part of premium content — purchase the course to attempt it.",
            "CHALLENGE_PREMIUM_LOCKED_EXCEPTION",
            {
                contentId,
                originalError,
            },
        )
    }
}
