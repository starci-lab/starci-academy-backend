import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Context id that matched no context record. */
export interface ContextNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    index: number
}

/** Fails lookup when the learning context row is absent. */
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

