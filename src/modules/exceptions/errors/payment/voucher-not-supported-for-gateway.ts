import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a voucher whose discount type the chosen gateway can't apply. */
export interface VoucherNotSupportedForGatewayExceptionMetadata extends AbstractExceptionMetadata {
    /** The payment type the caller requested. */
    paymentType: string
    /** The voucher's discount type (`percent` / `flat`) that triggered the rejection. */
    discountType: string
}

/**
 * Thrown when a checkout's `voucherCode` resolves to a discount type the
 * chosen `PaymentType` doesn't support (per `PAYMENT_MODIFIER_CAPABILITY`) —
 * today only a Flat (VND-denominated) voucher on a USD gateway (Stripe /
 * PayPal / Crypto), since Flat can't be FX-converted onto a USD charge.
 * Rejected loud, before any row or checkout is created — never a silent drop.
 */
export class VoucherNotSupportedForGatewayException extends AbstractException {
    constructor({
        paymentType,
        discountType,
        originalError,
    }: VoucherNotSupportedForGatewayExceptionMetadata) {
        super(
            "This voucher's discount type is not supported on the chosen payment gateway.",
            "VOUCHER_NOT_SUPPORTED_FOR_GATEWAY_EXCEPTION",
            {
                paymentType,
                discountType,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
