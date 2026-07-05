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
    /** Id of the user attempting to pay it. */
    userId: string
}

/**
 * Thrown when a "pay next installment" request targets a plan that either
 * does not exist or does not belong to the requesting user — both collapsed
 * into one not-found error so ownership is never leaked to the caller.
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
