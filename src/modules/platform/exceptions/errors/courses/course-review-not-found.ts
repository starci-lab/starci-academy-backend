import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a course review id does not resolve to a row. */
export interface CourseReviewNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    courseId?: string
    userId?: string
}

/**
 * Thrown when no review matches the requested id.
 *
 * A review is public once posted, so its absence is safe to state plainly: naming it does not
 * disclose anything a reader could not already have found by listing the course's reviews.
 */
export class CourseReviewNotFoundException extends AbstractException {
    constructor({
        id,
        courseId,
        userId,
        originalError,
    }: CourseReviewNotFoundExceptionMetadata) {
        super(
            "Course review not found",
            "COURSE_REVIEW_NOT_FOUND_EXCEPTION",
            {
                id,
                courseId,
                userId,
                originalError,
            },
        )
    }
}
