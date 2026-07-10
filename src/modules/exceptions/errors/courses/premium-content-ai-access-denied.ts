import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a content-AI question on premium content without entitlement. */
export interface PremiumContentAiAccessDeniedExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user asking. */
    userId: string
    /** Id of the premium content being asked about. */
    contentId: string
}

/**
 * Thrown when a user asks the content-AI chat about premium content without
 * an active enrollment in the owning course.
 */
export class PremiumContentAiAccessDeniedException extends AbstractException {
    constructor({
        userId,
        contentId,
        originalError,
    }: PremiumContentAiAccessDeniedExceptionMetadata) {
        super(
            "Enroll in this course to ask AI about premium content.",
            "PREMIUM_CONTENT_AI_ACCESS_DENIED_EXCEPTION",
            {
                userId,
                contentId,
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
