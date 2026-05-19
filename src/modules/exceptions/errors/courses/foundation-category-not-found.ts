import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface FoundationCategoryNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

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
