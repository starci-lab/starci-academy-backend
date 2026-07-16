import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link KpiRewardNotEligibleException}. */
export interface KpiRewardNotEligibleExceptionMetadata extends AbstractExceptionMetadata {
    /** The KPI key the claim was attempted for. */
    key: string
}

/**
 * The user tried to claim a weekly-KPI reward before the KPI's floor target
 * was met this week.
 */
export class KpiRewardNotEligibleException extends AbstractException {
    constructor(
        {
            key,
            originalError,
        }: KpiRewardNotEligibleExceptionMetadata,
    ) {
        super(
            `KPI reward not eligible yet for ${key}`,
            "KPI_REWARD_NOT_ELIGIBLE_EXCEPTION",
            {
                key,
                originalError,
            },
        )
    }
}
