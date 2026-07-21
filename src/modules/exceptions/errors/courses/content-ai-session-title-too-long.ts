import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a rejected content-AI session rename (title over the limit). */
export interface ContentAiSessionTitleTooLongExceptionMetadata extends AbstractExceptionMetadata {
    /** Length that was supplied. */
    length: number
    /** Maximum allowed length. */
    max: number
}

/**
 * Thrown when a content-AI conversation rename supplies a title longer than the
 * `content_ai_sessions.title` column allows (varchar(200)).
 */
export class ContentAiSessionTitleTooLongException extends AbstractException {
    constructor({
        length,
        max,
        originalError,
    }: ContentAiSessionTitleTooLongExceptionMetadata) {
        super(
            `Conversation title must be ${max} characters or fewer.`,
            "CONTENT_AI_SESSION_TITLE_TOO_LONG_EXCEPTION",
            {
                length,
                max,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
