import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a custom `amountVnd` below the current cycle's minimum payment. */
export interface InstallmentAmountBelowMinimumExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the plan. */
    planId: string
    /** VND amount the caller requested. */
    requestedVnd: number
    /** The current cycle's minimum payment, computed by `computeMinPaymentVnd`. */
    minPaymentVnd: number
}

/**
 * Thrown when `payNextInstallment` receives a custom `amountVnd` for a
 * `FlexiblePool` plan that is below the current cycle's minimum payment — a
 * top-up can only shrink future cycles, never skip the floor.
 */
export class InstallmentAmountBelowMinimumException extends AbstractException {
    constructor({
        planId,
        requestedVnd,
        minPaymentVnd,
        originalError,
    }: InstallmentAmountBelowMinimumExceptionMetadata) {
        super(
            "amountVnd must be at least the current cycle's minimum payment.",
            "INSTALLMENT_AMOUNT_BELOW_MINIMUM_EXCEPTION",
            {
                planId,
                requestedVnd,
                minPaymentVnd,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
