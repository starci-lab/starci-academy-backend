import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata when a transaction is already expired.
 */
export interface TransactionExpiredExceptionMetadata
    extends AbstractExceptionMetadata {
    /** The ID of the expired transaction. */
    id: string
    /** How long the transaction had been pending when the check ran, in ms. */
    timeSinceCreationMs?: number
    /** The allowed pending window, in ms, that {@link timeSinceCreationMs} exceeded. */
    allowedTimeSinceCreationMs?: number
}

/**
 * Thrown when a transaction is outside the allowed time window.
 */
export class TransactionExpiredException extends AbstractException {
    constructor({
        id,
        timeSinceCreationMs,
        allowedTimeSinceCreationMs,
        originalError,
    }: TransactionExpiredExceptionMetadata) {
        super(
            "Transaction expired",
            "TRANSACTION_EXPIRED_EXCEPTION",
            {
                id,
                timeSinceCreationMs,
                allowedTimeSinceCreationMs,
                originalError,
            },
        )
    }
}

