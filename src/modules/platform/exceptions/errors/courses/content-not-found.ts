import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Content id/displayId that matched no content row. */
export interface ContentNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    challengeId?: string
}

/**
 * Fails the request when the content does not exist — progress/comments must not attach to
 * a missing lesson.
 */
export class ContentNotFoundException extends AbstractException {
    constructor({
        id,
        challengeId,
        originalError,
    }: ContentNotFoundExceptionMetadata) {
        super(
            "Content not found",
            "CONTENT_NOT_FOUND_EXCEPTION",
            {
                id,
                challengeId,
                originalError,
            },
        )
    }
}
