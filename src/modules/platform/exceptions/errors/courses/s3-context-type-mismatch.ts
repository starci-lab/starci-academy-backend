import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Context that was expected to be S3-backed but was not. */
export interface S3ContextTypeMismatchExceptionMetadata extends AbstractExceptionMetadata {
    index: number
    actualType?: string
}

/** Rejects using the S3 reader against a non-S3 context. */
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

