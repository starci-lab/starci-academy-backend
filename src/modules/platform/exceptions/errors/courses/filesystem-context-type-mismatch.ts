import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Context that was expected to be filesystem-backed but was not. */
export interface FilesystemContextTypeMismatchExceptionMetadata extends AbstractExceptionMetadata {
    index: number
    actualType?: string
}

/** Rejects using the filesystem reader against a non-filesystem context. */
export class FilesystemContextTypeMismatchException extends AbstractException {
    constructor(
        {
            index,
            actualType,
            originalError,
        }: FilesystemContextTypeMismatchExceptionMetadata,
    ) {
        super(
            `Filesystem context type mismatch for index ${index}`,
            "FILESYSTEM_CONTEXT_TYPE_MISMATCH_EXCEPTION",
            {
                index,
                expectedType: "filesystem",
                actualType,
                originalError,
            },
        )
    }
}

