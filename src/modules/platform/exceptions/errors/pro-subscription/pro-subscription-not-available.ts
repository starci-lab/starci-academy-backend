import {
    AbstractException,
} from "../abstract"
import type {
    AbstractExceptionMetadata,
} from "../abstract"

/** Metadata retained when resolving the mounted Pro offer fails. */
export type ProSubscriptionNotAvailableExceptionMetadata = AbstractExceptionMetadata

/** Raised when the unified Pro offer is disabled or absent. */
export class ProSubscriptionNotAvailableException extends AbstractException {
    constructor({
        originalError,
    }: ProSubscriptionNotAvailableExceptionMetadata = {
    }) {
        super(
            "StarCi Pro is not available for purchase",
            "PRO_SUBSCRIPTION_NOT_AVAILABLE_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
