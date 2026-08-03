import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ContextNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    index: number
}

export class ContextNotFoundException extends AbstractException {
    constructor(
        {
            index,
            originalError,
        }: ContextNotFoundExceptionMetadata,
    ) {
        super(
            `Context not found for index ${index}`,
            "CONTEXT_NOT_FOUND_EXCEPTION",
            {
                index,
                originalError,
            },
        )
    }
}

