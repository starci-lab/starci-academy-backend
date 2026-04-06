import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ModuleDirNameNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    moduleIndex: number
}

/**
 * No `{moduleIndex}-*` module folder exists under the resolved course `modules/` directory.
 */
export class ModuleDirNameNotFoundException extends AbstractException {
    constructor(
        {
            courseIndex,
            moduleIndex,
            originalError,
        }: ModuleDirNameNotFoundExceptionMetadata,
    ) {
        super(
            `Module dir: no mount directory for index ${moduleIndex} (course ${courseIndex})`,
            "MODULE_DIR_NAME_NOT_FOUND_EXCEPTION",
            {
                courseIndex,
                moduleIndex,
                originalError,
            },
        )
    }
}
