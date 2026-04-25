import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface S3ContextNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    index: number
}

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

