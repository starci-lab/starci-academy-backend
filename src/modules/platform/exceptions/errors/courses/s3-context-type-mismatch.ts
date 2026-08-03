import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface S3ContextTypeMismatchExceptionMetadata extends AbstractExceptionMetadata {
    index: number
    actualType?: string
}

export class S3ContextTypeMismatchException extends AbstractException {
    constructor(
        {
            index,
            actualType,
            originalError,
        }: S3ContextTypeMismatchExceptionMetadata,
    ) {
        super(
            `S3 context type mismatch for index ${index}`,
            "S3_CONTEXT_TYPE_MISMATCH_EXCEPTION",
            {
                index,
                expectedType: "s3",
                actualType,
                originalError,
            },
        )
    }
}

