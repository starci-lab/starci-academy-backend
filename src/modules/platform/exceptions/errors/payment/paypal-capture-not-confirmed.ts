import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a PayPal webhook whose order capture is not yet confirmed. */
export interface PaypalCaptureNotConfirmedExceptionMetadata extends AbstractExceptionMetadata {
    /** PayPal order id. */
    orderId: string
    /** PayPal's reported capture status. */
    status: string
}

/**
 * Thrown when a PayPal webhook fires for an order whose capture status is not
 * `COMPLETED` -- reconciliation only proceeds once PayPal confirms the funds
 * were actually captured, not merely approved.
 */
export class PaypalCaptureNotConfirmedException extends AbstractException {
    constructor({
        orderId,
        status,
        originalError,
    }: PaypalCaptureNotConfirmedExceptionMetadata) {
        super(
            "PayPal order capture is not confirmed.",
            "PAYPAL_CAPTURE_NOT_CONFIRMED_EXCEPTION",
            {
                orderId,
                status,
                originalError,
            },
            HttpStatus.CONFLICT,
        )
    }
}
