import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface FilesystemContextNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    index: number
}

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

