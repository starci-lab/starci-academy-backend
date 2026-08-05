import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Id that should have resolved a filesystem-backed context. */
export interface FilesystemContextNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    index: number
}

/** Stops mount reads when the context is not filesystem-backed. */
export class FilesystemContextNotFoundException extends AbstractException {
    constructor(
        {
            index,
            originalError,
        }: FilesystemContextNotFoundExceptionMetadata,
    ) {
        super(
            `Filesystem context not found for index ${index}`,
            "FILESYSTEM_CONTEXT_NOT_FOUND_EXCEPTION",
            {
                index,
                originalError,
            },
        )
    }
}

