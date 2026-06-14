import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the membership-not-available exception.
 */
export type MembershipNotAvailableExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when a user tries to purchase community membership while it is
 * disabled (`membership.enabled: false`) in `app.yaml`.
 */
export class MembershipNotAvailableException extends AbstractException {
    constructor({
        originalError,
    }: MembershipNotAvailableExceptionMetadata = {
    }) {
        super(
            "Community membership is not available for purchase",
            "MEMBERSHIP_NOT_AVAILABLE_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
