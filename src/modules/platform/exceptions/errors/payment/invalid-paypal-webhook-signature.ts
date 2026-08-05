import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a PayPal webhook that failed signature verification. */
export interface InvalidPaypalWebhookSignatureExceptionMetadata extends AbstractExceptionMetadata {
    /** PayPal webhook event id, when present on the payload. */
    eventId?: string
}

/**
 * Thrown when a PayPal webhook's signature verification fails -- the payload
 * is discarded rather than reconciled, since it may not actually be from
 * PayPal.
 */
export class InvalidPaypalWebhookSignatureException extends AbstractException {
    constructor({
        eventId,
        originalError,
    }: InvalidPaypalWebhookSignatureExceptionMetadata) {
        super(
            "Invalid PayPal webhook signature.",
            "INVALID_PAYPAL_WEBHOOK_SIGNATURE_EXCEPTION",
            {
                eventId,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
