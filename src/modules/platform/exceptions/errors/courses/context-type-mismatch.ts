import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Expected vs actual context type for the resolved record. */
export interface ContextTypeMismatchExceptionMetadata extends AbstractExceptionMetadata {
    index: number
    expectedType: string
    actualType?: string
}

/**
 * Rejects a context that is the wrong kind (filesystem vs S3, etc.) so the wrong reader is
 * never used.
 */
export class ContextTypeMismatchException extends AbstractException {
    constructor(
        {
            index,
            expectedType,
            actualType,
            originalError,
        }: ContextTypeMismatchExceptionMetadata,
    ) {
        super(
            `Context type mismatch for index ${index}`,
            "CONTEXT_TYPE_MISMATCH_EXCEPTION",
            {
                index,
                expectedType,
                actualType,
                originalError,
            },
        )
    }
}

