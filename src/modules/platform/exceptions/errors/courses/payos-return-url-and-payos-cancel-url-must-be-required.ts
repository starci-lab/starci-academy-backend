import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for missing PayOS URLs (helps Sentry without logging raw URLs). */
export interface PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredExceptionMetadata
    extends AbstractExceptionMetadata {
    hasPayOsReturnUrl: boolean
    hasPayOsCancelUrl: boolean
}

/**
 * Thrown when `paymentType` is PayOS but `payosReturnUrl` or `payosCancelUrl` is missing.
 *
 * The code follows the class name (`IDENTITY-2`). It used to be pinned to
 * `PAYOS_RETURN_URL_AND_PAYOS_CANCEL_URL_MUST_BE_REQUIRED` for the sake of Sentry grouping, and that
 * pin is what let this class keep an `Error` name no exception rule could see. The grouping key
 * changed on 2026-08-14, so Sentry history for this failure splits there; no client matches the code.
 */
export class PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException extends AbstractException {
    constructor({
        hasPayOsReturnUrl,
        hasPayOsCancelUrl,
        originalError,
    }: PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredExceptionMetadata) {
        super(
            "payosReturnUrl and payosCancelUrl are required when paymentType is PayOS.",
            "PAYOS_RETURN_URL_AND_PAYOS_CANCEL_URL_MUST_BE_REQUIRED_EXCEPTION",
            {
                hasPayOsReturnUrl,
                hasPayOsCancelUrl,
                originalError,
            },
        )
    }
}
