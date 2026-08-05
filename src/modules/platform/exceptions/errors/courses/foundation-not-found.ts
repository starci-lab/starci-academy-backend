import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Foundation id/displayId that matched no row. */
export interface FoundationNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

/** Fails foundation lookup when the foundation does not exist. */
export class FoundationNotFoundException extends AbstractException {
    constructor({
        id,
        displayId,
        originalError,
    }: FoundationNotFoundExceptionMetadata) {
        super(
            "Foundation not found",
            "FOUNDATION_NOT_FOUND_EXCEPTION",
            {
                id,
                displayId,
                originalError,
            },
        )
    }
}
