import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an installment plan lookup that found no matching row for this user. */
export interface InstallmentPlanNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the plan looked up. */
    planId: string
    /**
     * Id of the user attempting to pay it. Omitted for a lookup that is not
     * user-scoped — e.g. `InstallmentPlanService.recordPayment`, driven by
     * the reconcile worker off a plan id alone.
     */
    userId?: string
}

/**
 * Thrown when an installment plan id does not resolve to a row — either a
 * "pay next installment" request targeting a plan that does not exist or
 * does not belong to the requesting user (both collapsed into one not-found
 * error so ownership is never leaked to the caller), or an internal
 * plan-id lookup (e.g. `recordPayment`) whose id is stale/unknown.
 */
export class InstallmentPlanNotFoundException extends AbstractException {
    constructor({
        planId,
        userId,
        originalError,
    }: InstallmentPlanNotFoundExceptionMetadata) {
        super(
            "Installment plan not found",
            "INSTALLMENT_PLAN_NOT_FOUND_EXCEPTION",
            {
                planId,
                userId,
                originalError,
            },
        )
    }
}
