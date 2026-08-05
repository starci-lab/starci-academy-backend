import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Content index whose `{index}-*` folder name could not be resolved on the mount. */
export interface ContentPathNameNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseRelativePath: string
    moduleRelativePath: string
    contentIndex: number
}

/**
 * No `{contentIndex}-*` (or legacy numeric) content folder under the module `contents/` directory.
 */
export class ContentPathNameNotFoundException extends AbstractException {
    constructor(
        {
            courseRelativePath,
            moduleRelativePath,
            contentIndex,
            originalError,
        }: ContentPathNameNotFoundExceptionMetadata,
    ) {
        super(
            `Content path: no mount directory for content index ${contentIndex} (course ${courseRelativePath}, module ${moduleRelativePath})`,
            "CONTENT_PATH_NAME_NOT_FOUND_EXCEPTION",
            {
                courseRelativePath,
                moduleRelativePath,
                contentIndex,
                originalError,
            },
        )
    }
}
