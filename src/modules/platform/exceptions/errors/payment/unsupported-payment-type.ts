import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a checkout that reached a payment-type switch with no matching case. */
export interface UnsupportedPaymentTypeExceptionMetadata extends AbstractExceptionMetadata {
    /** The payment type that had no handler branch. */
    paymentType: string
}

/**
 * Thrown when a checkout's `paymentType` switch falls through to `default` —
 * every gateway is handled by an explicit `case`, so this only fires if a new
 * `PaymentType` enum member was added without wiring its checkout branch.
 */
export class UnsupportedPaymentTypeException extends AbstractException {
    constructor({
        paymentType,
        originalError,
    }: UnsupportedPaymentTypeExceptionMetadata) {
        super(
            "Unsupported payment type.",
            "UNSUPPORTED_PAYMENT_TYPE_EXCEPTION",
            {
                paymentType,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
