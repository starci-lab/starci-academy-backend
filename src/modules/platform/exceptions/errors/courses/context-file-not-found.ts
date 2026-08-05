import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Context file path that was expected on the mount. */
export interface ContextFileNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    relativePath: string
}

/**
 * Aborts seed/load when the context markdown file is missing — entities must not ship
 * empty context.
 */
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

