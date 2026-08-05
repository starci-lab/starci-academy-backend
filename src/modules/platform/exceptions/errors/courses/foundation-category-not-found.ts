import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Foundation-category id/displayId that matched no row. */
export interface FoundationCategoryNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

/** Fails foundation browse when the category does not exist. */
export class FoundationCategoryNotFoundException extends AbstractException {
    constructor({
        id,
        displayId,
        originalError,
    }: FoundationCategoryNotFoundExceptionMetadata) {
        super(
            "Foundation category not found",
            "FOUNDATION_CATEGORY_NOT_FOUND_EXCEPTION",
            {
                id,
                displayId,
                originalError,
            },
        )
    }
}
