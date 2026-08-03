import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"
import type {
    InstallmentPlanStatus,
} from "@modules/databases"

/** Metadata for an installment plan that has nothing left to pay. */
export interface InstallmentPlanNotPayableExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the plan. */
    planId: string
    /** The plan's current status (already `completed`). */
    status: InstallmentPlanStatus
}

/**
 * Thrown when a "pay next installment" request targets a plan that is
 * already `completed` — there is no next cycle to charge.
 */
export class InstallmentPlanNotPayableException extends AbstractException {
    constructor({
        planId,
        status,
        originalError,
    }: InstallmentPlanNotPayableExceptionMetadata) {
        super(
            "This installment plan has nothing left to pay",
            "INSTALLMENT_PLAN_NOT_PAYABLE_EXCEPTION",
            {
                planId,
                status,
                originalError,
            },
        )
    }
}
