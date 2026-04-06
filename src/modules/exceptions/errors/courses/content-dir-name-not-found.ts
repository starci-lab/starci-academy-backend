import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ContentDirNameNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    moduleIndex: number
    contentIndex: number
}

/**
 * No `{contentIndex}-*` (or legacy numeric) content folder under the module `contents/` directory.
 */
export class ContentDirNameNotFoundException extends AbstractException {
    constructor(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            originalError,
        }: ContentDirNameNotFoundExceptionMetadata,
    ) {
        super(
            `Content dir: no mount directory for content index ${contentIndex} (course ${courseIndex}, module ${moduleIndex})`,
            "CONTENT_DIR_NAME_NOT_FOUND_EXCEPTION",
            {
                courseIndex,
                moduleIndex,
                contentIndex,
                originalError,
            },
        )
    }
}
