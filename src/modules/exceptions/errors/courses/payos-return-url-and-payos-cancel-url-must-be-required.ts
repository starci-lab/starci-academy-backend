import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for missing PayOS URLs (helps Sentry without logging raw URLs). */
export interface PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredErrorMetadata
    extends AbstractExceptionMetadata {
    hasPayOsReturnUrl: boolean
    hasPayOsCancelUrl: boolean
}

/**
 * Thrown when `paymentType` is PayOS but `payosReturnUrl` or `payosCancelUrl` is missing.
 * Code is stable for Sentry grouping: `PAYOS_RETURN_URL_AND_PAYOS_CANCEL_URL_MUST_BE_REQUIRED`.
 */
export class PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError extends AbstractException {
    constructor({
        hasPayOsReturnUrl,
        hasPayOsCancelUrl,
        originalError,
    }: PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredErrorMetadata) {
        super(
            "payosReturnUrl and payosCancelUrl are required when paymentType is PayOS.",
            "PAYOS_RETURN_URL_AND_PAYOS_CANCEL_URL_MUST_BE_REQUIRED",
            {
                hasPayOsReturnUrl,
                hasPayOsCancelUrl,
                originalError,
            },
        )
    }
}
