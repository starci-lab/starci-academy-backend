import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Content index whose path was missing from the resolved `paths` list. */
export interface ContentPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    contentIndex: number
}

/**
 * No content path is available in the resolved `paths` list for the given index.
 */
export class ContentPathNotFoundException extends AbstractException {
    constructor(
        {
            contentIndex,
            originalError,
        }: ContentPathNotFoundExceptionMetadata,
    ) {
        super(
            `Content path not found for index ${contentIndex}`,
            "CONTENT_PATH_NOT_FOUND_EXCEPTION",
            {
                contentIndex,
                originalError,
            },
        )
    }
}
