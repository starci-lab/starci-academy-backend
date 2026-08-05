import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a gateway webhook reporting a paid amount below what was charged. */
export interface PaymentUnderpaidExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the order/invoice as tracked by the gateway. */
    orderId: string
    /** VND amount the gateway reported as paid. */
    reportedAmountVnd: number
    /** VND amount the checkout expected. */
    expectedAmountVnd: number
    /** Gateway that reported the underpayment (`"payos"` | `"sepay"`). */
    provider: string
}

/**
 * Thrown when a gateway webhook (PayOS/SePay) reports a paid amount lower
 * than the transaction's charged total -- never reconciled as a success, since
 * that would enroll/credit the user for less than they actually paid.
 */
export class PaymentUnderpaidException extends AbstractException {
    constructor({
        orderId,
        reportedAmountVnd,
        expectedAmountVnd,
        provider,
        originalError,
    }: PaymentUnderpaidExceptionMetadata) {
        super(
            "Reported payment amount is below the expected charge.",
            "PAYMENT_UNDERPAID_EXCEPTION",
            {
                orderId,
                reportedAmountVnd,
                expectedAmountVnd,
                provider,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
