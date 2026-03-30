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
 * Thrown when no preflight transaction row matches a webhook request.
 */
export class TransactionNotFoundException extends AbstractException {
    constructor({
        referenceId,
        id,
        originalError,
    }: TransactionNotFoundExceptionMetadata) {
        super(
            "Preflight transaction not found",
            "PREFLIGHT_TRANSACTION_NOT_FOUND_EXCEPTION",
            {
                referenceId,
                id,
                originalError,
            },
        )
    }
}

