import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a module id does not exist. */
export interface ModuleNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id: string
}

/** Thrown when no module matches the requested id. */
export class ModuleNotFoundException extends AbstractException {
    constructor({
        id,
        originalError,
    }: ModuleNotFoundExceptionMetadata) {
        super(
            "Module not found",
            "MODULE_NOT_FOUND_EXCEPTION",
            {
                id,
                originalError,
            },
        )
    }
}

