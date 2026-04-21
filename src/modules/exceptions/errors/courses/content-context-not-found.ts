import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ContentContextNotFoundMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

export class ContentContextNotFound extends AbstractException {
    constructor({
        id,
        displayId,
        originalError,
    }: ContentContextNotFoundMetadata) {
        super(
            "Content context not found: id or displayId must be provided",
            "CONTENT_CONTEXT_NOT_FOUND",
            {
                id,
                displayId,
                originalError,
            },
        )
    }
}
