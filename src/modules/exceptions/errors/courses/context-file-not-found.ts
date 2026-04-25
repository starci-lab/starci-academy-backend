import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ContextFileNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    relativePath: string
}

export class ContextFileNotFoundException extends AbstractException {
    constructor(
        {
            relativePath,
            originalError,
        }: ContextFileNotFoundExceptionMetadata,
    ) {
        super(
            `Context file not found: ${relativePath}`,
            "CONTEXT_FILE_NOT_FOUND_EXCEPTION",
            {
                relativePath,
                originalError,
            },
        )
    }
}

