import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface FoundationNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

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
