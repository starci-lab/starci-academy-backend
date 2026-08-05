import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the course-learning-history-failed exception.
 */
export interface CourseLearningHistoryFailedExceptionMetadata
    extends AbstractExceptionMetadata {
    /** Short reason the learning-history read failed. */
    reason: string
}

/**
 * Thrown by the `courseLearningHistory` resolver when the per-course learning
 * timeline cannot be built -- e.g. a malformed course global id, or the
 * underlying joined query failing. Wraps the original error so the cause is
 * preserved rather than flattened into a bare message.
 */
export class CourseLearningHistoryFailedException extends AbstractException {
    constructor({
        reason,
        originalError,
    }: CourseLearningHistoryFailedExceptionMetadata) {
        super(
            `Failed to build course learning history: ${reason}`,
            "COURSE_LEARNING_HISTORY_FAILED_EXCEPTION",
            {
                reason,
                originalError,
            },
        )
    }
}
