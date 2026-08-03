import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface FoundationCategoryPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Resolved `orderIndex` that has no matching entry in `paths`. */
    categoryIndex: number
}

/**
 * No foundation category path is available in the resolved `paths` list for the given index.
 */
export class FoundationCategoryPathNotFoundException extends AbstractException {
    constructor(
        {
            categoryIndex,
            originalError,
        }: FoundationCategoryPathNotFoundExceptionMetadata,
    ) {
        super(
            `Foundation category path not found for index ${categoryIndex}`,
            "FOUNDATION_CATEGORY_PATH_NOT_FOUND_EXCEPTION",
            {
                categoryIndex,
                originalError,
            },
        )
    }
}
