import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when no enrollment row exists for a (user, course) pair. */
export interface EnrollmentNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user that was expected to be enrolled. */
    userId: string
    /** Id of the course the user was expected to be enrolled in. */
    courseId: string
}

/**
 * Thrown when a viewer-scoped read requires the viewer to be enrolled in the
 * course but no enrollment row exists for the (user, course) pair.
 */
export class EnrollmentNotFoundException extends AbstractException {
    constructor({
        userId,
        courseId,
        originalError,
    }: EnrollmentNotFoundExceptionMetadata) {
        super(
            `No enrollment for user "${userId}" in course "${courseId}"`,
            "ENROLLMENT_NOT_FOUND_EXCEPTION",
            {
                userId,
                courseId,
                originalError,
            },
        )
    }
}
