import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Module index whose `{index}-*` folder name could not be resolved on the mount. */
export interface ModulePathNameNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseRelativePath: string
    moduleIndex: number
}

/**
 * No `{moduleIndex}-*` module folder exists under the resolved course `modules/` directory.
 */
export class ModulePathNameNotFoundException extends AbstractException {
    constructor(
        {
            courseRelativePath,
            moduleIndex,
            originalError,
        }: ModulePathNameNotFoundExceptionMetadata,
    ) {
        super(
            `Module dir: no mount directory for index ${moduleIndex} (course ${courseRelativePath})`,
            "MODULE_PATH_NAME_NOT_FOUND_EXCEPTION",
            {
                courseRelativePath,
                moduleIndex,
                originalError,
            },
        )
    }
}
