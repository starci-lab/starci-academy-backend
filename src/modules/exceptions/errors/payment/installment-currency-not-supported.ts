import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a checkout requesting installments on a non-VND gateway. */
export interface InstallmentCurrencyNotSupportedExceptionMetadata extends AbstractExceptionMetadata {
    /** The payment type the caller requested. */
    paymentType: string
}

/**
 * Thrown when a checkout requests `installmentMonths` on a gateway other than
 * PayOS/Sepay — installments are VND-only, later cycles can't be collected on
 * international gateways.
 */
export class InstallmentCurrencyNotSupportedException extends AbstractException {
    constructor({
        paymentType,
        originalError,
    }: InstallmentCurrencyNotSupportedExceptionMetadata) {
        super(
            "Installments only support PayOS/Sepay (VND).",
            "INSTALLMENT_CURRENCY_NOT_SUPPORTED_EXCEPTION",
            {
                paymentType,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
