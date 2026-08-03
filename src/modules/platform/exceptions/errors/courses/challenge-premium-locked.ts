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
 * Thrown when a learner tries to attempt a challenge whose owning content is
 * premium. Challenges are currently open ONLY inside non-premium (free) content;
 * a premium content's challenge requires purchasing the course first.
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
