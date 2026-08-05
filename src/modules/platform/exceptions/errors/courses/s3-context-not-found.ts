import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Id that should have resolved an S3-backed context. */
export interface S3ContextNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    index: number
}

/** Stops S3 reads when the context is not S3-backed. */
export class S3ContextNotFoundException extends AbstractException {
    constructor(
        {
            index,
            originalError,
        }: S3ContextNotFoundExceptionMetadata,
    ) {
        super(
            `S3 context not found for index ${index}`,
            "S3_CONTEXT_NOT_FOUND_EXCEPTION",
            {
                index,
                originalError,
            },
        )
    }
}

