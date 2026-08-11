import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"
import type {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"

/** Metadata describing why a transaction cannot enter the refund transition. */
export interface TransactionNotRefundableExceptionMetadata extends AbstractExceptionMetadata {
    id: string
    status: TransactionStatus
    reason: string
}

/** A refund may reverse only a settled, non-installment course purchase. */
export class TransactionNotRefundableException extends AbstractException {
    constructor({
        id,
        status,
        reason,
        originalError,
    }: TransactionNotRefundableExceptionMetadata) {
        super(
            `Transaction "${id}" cannot be refunded: ${reason}`,
            "TRANSACTION_NOT_REFUNDABLE_EXCEPTION",
            {
                id,
                status,
                reason,
                originalError,
            },
        )
    }
}
