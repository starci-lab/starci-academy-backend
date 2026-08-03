import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when the user already has an enrollment for the course. */
export interface CourseAlreadyEnrolledErrorMetadata extends AbstractExceptionMetadata {
    courseId: string
    userId: string
}

/** Thrown when the user attempts checkout for a course they are already enrolled in. */
export class CourseAlreadyEnrolledError extends AbstractException {
    constructor({
        courseId,
        userId,
        originalError,
    }: CourseAlreadyEnrolledErrorMetadata) {
        super(
            "User is already enrolled in this course.",
            "COURSE_ALREADY_ENROLLED_ERROR",
            {
                courseId,
                userId,
                originalError,
            },
        )
    }
}
