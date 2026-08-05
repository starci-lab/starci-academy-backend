import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a NOWPayments IPN callback that failed signature verification. */
export interface InvalidNowpaymentsWebhookSignatureExceptionMetadata extends AbstractExceptionMetadata {
    /** NOWPayments invoice/payment id, when present on the payload. */
    paymentId?: string
}

/**
 * Thrown when a NOWPayments IPN callback's HMAC signature verification fails
 * -- the payload is discarded rather than reconciled, since it may not
 * actually be from NOWPayments.
 */
export class InvalidNowpaymentsWebhookSignatureException extends AbstractException {
    constructor({
        paymentId,
        originalError,
    }: InvalidNowpaymentsWebhookSignatureExceptionMetadata) {
        super(
            "Invalid NOWPayments IPN signature.",
            "INVALID_NOWPAYMENTS_WEBHOOK_SIGNATURE_EXCEPTION",
            {
                paymentId,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
