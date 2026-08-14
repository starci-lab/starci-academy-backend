import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata when a transaction cannot be found.
 */
export interface TransactionNotFoundExceptionMetadata
    extends AbstractExceptionMetadata {
    /**
     * The reference ID used to look up the transaction.
     */
    referenceId?: string
    /**
     * The ID of the transaction.
     */
    id?: string
}

/**
 * Thrown when no transaction row matches a webhook request.
 */
export class TransactionNotFoundException extends AbstractException {
    constructor({
        referenceId,
        id,
        originalError,
    }: TransactionNotFoundExceptionMetadata) {
        super(
            "Transaction not found",
            "TRANSACTION_NOT_FOUND_EXCEPTION",
            {
                referenceId,
                id,
                originalError,
            },
        )
    }
}

