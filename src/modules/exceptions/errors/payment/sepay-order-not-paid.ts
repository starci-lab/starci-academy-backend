import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a SePay webhook reporting a non-paid transaction status. */
export interface SepayOrderNotPaidExceptionMetadata extends AbstractExceptionMetadata {
    /** SePay invoice/order reference. */
    invoice: string
    /** SePay's reported detail status for the transaction. */
    detailStatus: string
}

/**
 * Thrown when a SePay webhook fires for an order whose `detailStatus` is not
 * a paid state — reconciliation only proceeds on a confirmed payment.
 */
export class SepayOrderNotPaidException extends AbstractException {
    constructor({
        invoice,
        detailStatus,
        originalError,
    }: SepayOrderNotPaidExceptionMetadata) {
        super(
            "SePay order is not paid.",
            "SEPAY_ORDER_NOT_PAID_EXCEPTION",
            {
                invoice,
                detailStatus,
                originalError,
            },
            HttpStatus.CONFLICT,
        )
    }
}
