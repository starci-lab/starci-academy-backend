import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Content id/displayId that failed to resolve a filesystem/S3 context. */
export interface ContentContextNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

/** Stops content hydration when neither id nor displayId resolves a context. */
export class ContentContextNotFoundException extends AbstractException {
    constructor({
        id,
        displayId,
        originalError,
    }: ContentContextNotFoundExceptionMetadata) {
        super(
            "Content context not found: id or displayId must be provided",
            "CONTENT_CONTEXT_NOT_FOUND_EXCEPTION",
            {
                id,
                displayId,
                originalError,
            },
        )
    }
}
