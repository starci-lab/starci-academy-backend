import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a caller without a paid enrollment tries to review a course. */
export interface CourseReviewRequiresEnrollmentExceptionMetadata extends AbstractExceptionMetadata {
    courseId?: string
    userId?: string
}

/**
 * Thrown when the caller has no paid enrollment on the course they are reviewing.
 *
 * Distinct from a plain enrollment lookup miss on purpose: to a reader this is not an error but an
 * invitation to buy the course, and a client shows something different for each. A trial row
 * (`isEnrolled: false`) lands here too -- per AUTHZ-5 the row's existence is not the entitlement,
 * and the field that separates a purchase from a trial is what the gate reads.
 */
export class CourseReviewRequiresEnrollmentException extends AbstractException {
    constructor({
        courseId,
        userId,
        originalError,
    }: CourseReviewRequiresEnrollmentExceptionMetadata) {
        super(
            "A paid enrollment is required to review this course",
            "COURSE_REVIEW_REQUIRES_ENROLLMENT_EXCEPTION",
            {
                courseId,
                userId,
                originalError,
            },
        )
    }
}
