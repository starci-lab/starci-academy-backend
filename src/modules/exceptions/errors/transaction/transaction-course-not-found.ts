import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata when a transaction courseId is missing for a webhook.
 */
export interface TransactionCourseNotFoundExceptionMetadata
    extends AbstractExceptionMetadata {
    /** The ID of the transaction missing its course. */
    id: string
}

/**
 * Thrown when a transaction exists but has no associated courseId.
 */
export class TransactionCourseNotFoundException extends AbstractException {
    constructor({
        id,
        originalError,
    }: TransactionCourseNotFoundExceptionMetadata) {
        super(
            "Transaction course not found",
            "TRANSACTION_COURSE_NOT_FOUND_EXCEPTION",
            {
                id,
                originalError,
            },
        )
    }
}

