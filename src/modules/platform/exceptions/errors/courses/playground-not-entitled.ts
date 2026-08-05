import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link PlaygroundNotEntitledException}. */
export interface PlaygroundNotEntitledExceptionMetadata extends AbstractExceptionMetadata {
    /** Learner who attempted to create a playground session. */
    userId: string
    /** Playground the learner attempted to start. */
    playgroundId: string
}

/**
 * Thrown when a learner without an active enrollment tries to create a
 * playground session. Mirrors the "enroll OR pay unlocks higher tiers" rule
 * used by {@link AiEntitlementService} -- a playground requires at least one
 * active enrollment.
 */
export class PlaygroundNotEntitledException extends AbstractException {
    constructor({
        userId,
        playgroundId,
        originalError,
    }: PlaygroundNotEntitledExceptionMetadata) {
        super(
            "An active enrollment is required to start this playground.",
            "PLAYGROUND_NOT_ENTITLED_EXCEPTION",
            {
                userId,
                playgroundId,
                originalError,
            },
        )
    }
}
