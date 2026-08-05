import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Template-CV index whose mount path was missing. */
export interface TemplateCvPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /**
     * Resolved `orderIndex` under `cv/` that has no matching entry in `paths`.
     */
    templateIndex: number
}

/**
 * No template CV path is available in the resolved `paths` list for the given index.
 */
export class TemplateCvPathNotFoundException extends AbstractException {
    constructor(
        {
            templateIndex,
            originalError,
        }: TemplateCvPathNotFoundExceptionMetadata,
    ) {
        super(
            `Template CV path not found for index ${templateIndex}`,
            "TEMPLATE_CV_PATH_NOT_FOUND_EXCEPTION",
            {
                templateIndex,
                originalError,
            },
        )
    }
}
