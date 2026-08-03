import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"
import type {
    RewardRedemptionStatus,
} from "@modules/databases"

/** Metadata for {@link RewardRedemptionNotFulfillableException}. */
export interface RewardRedemptionNotFulfillableExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the redemption ops tried to fulfil. */
    redemptionId: string
    /** The redemption's current status (not `pending`). */
    status: RewardRedemptionStatus
}

/**
 * Thrown when `fulfillRedemption` targets a redemption that isn't currently
 * `pending` — a digital reward that's already `granted`, or a physical
 * redemption already `fulfilled`/`cancelled`. Only a pending physical
 * redemption has a fulfilment step.
 */
export class RewardRedemptionNotFulfillableException extends AbstractException {
    constructor(
        {
            redemptionId,
            status,
            originalError,
        }: RewardRedemptionNotFulfillableExceptionMetadata,
    ) {
        super(
            `Redemption "${redemptionId}" is not fulfillable (status: ${status})`,
            "REWARD_REDEMPTION_NOT_FULFILLABLE_EXCEPTION",
            {
                redemptionId,
                status,
                originalError,
            },
        )
    }
}
