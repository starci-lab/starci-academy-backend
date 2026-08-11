import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an attempt to replace immutable provider refund evidence. */
export interface TransactionRefundReferenceConflictExceptionMetadata extends AbstractExceptionMetadata {
    id: string
    expectedReference: string
    receivedReference: string
}

/** Prevents a second provider event from being attached to an already-refunded payment. */
export class TransactionRefundReferenceConflictException extends AbstractException {
    constructor({
        id,
        expectedReference,
        receivedReference,
        originalError,
    }: TransactionRefundReferenceConflictExceptionMetadata) {
        super(
            `Transaction "${id}" was already refunded with another provider reference`,
            "TRANSACTION_REFUND_REFERENCE_CONFLICT_EXCEPTION",
            {
                id,
                expectedReference,
                receivedReference,
                originalError,
            },
        )
    }
}
