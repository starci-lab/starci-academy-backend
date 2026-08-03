import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ContextTypeMismatchExceptionMetadata extends AbstractExceptionMetadata {
    index: number
    expectedType: string
    actualType?: string
}

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

