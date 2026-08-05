import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a webhook whose transaction reached an unhandled `ActionType`. */
export interface UnsupportedTransactionActionExceptionMetadata extends AbstractExceptionMetadata {
    /** The `ActionType` value that had no handler branch. */
    actionType: string
}

/**
 * Thrown when a gateway webhook's reconciliation switch on `transaction.actionType`
 * falls through to `default` -- every action type is handled by an explicit `case`,
 * so this only fires if a new `ActionType` enum member was added without wiring
 * its webhook reconciliation branch.
 */
export class UnsupportedTransactionActionException extends AbstractException {
    constructor({
        actionType,
        originalError,
    }: UnsupportedTransactionActionExceptionMetadata) {
        super(
            "Unsupported transaction action type.",
            "UNSUPPORTED_TRANSACTION_ACTION_EXCEPTION",
            {
                actionType,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
