import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link KpiRewardAlreadyClaimedException}. */
export interface KpiRewardAlreadyClaimedExceptionMetadata extends AbstractExceptionMetadata {
    /** The KPI key already claimed this week. */
    key: string
}

/**
 * The user already claimed this KPI's reward for the current KPI week.
 */
export class KpiRewardAlreadyClaimedException extends AbstractException {
    constructor(
        {
            key,
            originalError,
        }: KpiRewardAlreadyClaimedExceptionMetadata,
    ) {
        super(
            `KPI reward already claimed this week for ${key}`,
            "KPI_REWARD_ALREADY_CLAIMED_EXCEPTION",
            {
                key,
                originalError,
            },
        )
    }
}
