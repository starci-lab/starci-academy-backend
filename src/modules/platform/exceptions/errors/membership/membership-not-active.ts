import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the membership-not-active exception.
 */
export interface MembershipNotActiveExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user whose membership was required but is missing/expired. */
    userId: string
}

/**
 * Thrown when an action requires an active community membership but the user
 * has none, or theirs has expired/been cancelled past its period end.
 */
export class MembershipNotActiveException extends AbstractException {
    constructor({
        userId,
        originalError,
    }: MembershipNotActiveExceptionMetadata) {
        super(
            `User "${userId}" does not have an active community membership`,
            "MEMBERSHIP_NOT_ACTIVE_EXCEPTION",
            {
                userId,
                originalError,
            },
        )
    }
}
