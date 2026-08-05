import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"
import type {
    InstallmentPlanType,
} from "@modules/databases/postgresql/primary/enums/installment-plan-type"

/** Metadata for a custom `amountVnd` requested on a plan that doesn't allow one. */
export interface InstallmentCustomAmountNotAllowedExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the plan. */
    planId: string
    /** The plan's type (always `Fixed` when this is thrown -- `FlexiblePool` allows a custom amount). */
    planType: InstallmentPlanType
}

/**
 * Thrown when `payNextInstallment` receives a custom `amountVnd` for a `Fixed`
 * plan -- Fixed plans always charge the fixed monthly amount; only
 * `FlexiblePool` lets the caller top up more than the minimum.
 */
export class InstallmentCustomAmountNotAllowedException extends AbstractException {
    constructor({
        planId,
        planType,
        originalError,
    }: InstallmentCustomAmountNotAllowedExceptionMetadata) {
        super(
            "Custom amountVnd is only allowed for FlexiblePool plans — Fixed plans always charge the fixed monthly amount.",
            "INSTALLMENT_CUSTOM_AMOUNT_NOT_ALLOWED_EXCEPTION",
            {
                planId,
                planType,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
