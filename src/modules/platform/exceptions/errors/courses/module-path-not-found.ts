import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Module index whose path was missing from the resolved `paths` list. */
export interface ModulePathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    moduleIndex: number
}

/**
 * No module path is available in the resolved `paths` list for the given index.
 */
export class ModulePathNotFoundException extends AbstractException {
    constructor(
        {
            moduleIndex,
            originalError,
        }: ModulePathNotFoundExceptionMetadata,
    ) {
        super(
            `Module path not found for index ${moduleIndex}`,
            "MODULE_PATH_NOT_FOUND_EXCEPTION",
            {
                moduleIndex,
                originalError,
            },
        )
    }
}
