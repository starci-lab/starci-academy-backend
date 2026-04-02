import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a module id or display id does not exist. */
export interface ModuleNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

/** Thrown when no module matches the requested id or display id. */
export class ModuleNotFoundException extends AbstractException {
    constructor({
        id,
        displayId,
        originalError,
    }: ModuleNotFoundExceptionMetadata) {
        super(
            "Module not found",
            "MODULE_NOT_FOUND_EXCEPTION",
            {
                id,
                displayId,
                originalError,
            },
        )
    }
}
