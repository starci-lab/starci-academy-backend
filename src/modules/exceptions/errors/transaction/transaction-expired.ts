import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata when a transaction is already expired.
 */
export interface TransactionExpiredErrorMetadata
    extends AbstractExceptionMetadata {
    id: string
    timeSinceCreationMs?: number
    allowedTimeSinceCreationMs?: number
}

/**
 * Thrown when a transaction is outside the allowed time window.
 */
export class TransactionExpiredError extends AbstractException {
    constructor({
        id,
        timeSinceCreationMs,
        allowedTimeSinceCreationMs,
        originalError,
    }: TransactionExpiredErrorMetadata) {
        super(
            "Transaction expired",
            "TRANSACTION_EXPIRED_ERROR",
            {
                id,
                timeSinceCreationMs,
                allowedTimeSinceCreationMs,
                originalError,
            },
        )
    }
}

