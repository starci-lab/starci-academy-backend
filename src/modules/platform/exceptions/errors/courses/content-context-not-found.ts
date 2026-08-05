import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Content id/displayId that failed to resolve a filesystem/S3 context. */
export interface ContentContextNotFoundMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

/** Stops content hydration when neither id nor displayId resolves a context. */
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
