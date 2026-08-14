import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when the user already has an enrollment for the course. */
export interface CourseAlreadyEnrolledExceptionMetadata extends AbstractExceptionMetadata {
    courseId: string
    userId: string
}

/** Thrown when the user attempts checkout for a course they are already enrolled in. */
export class CourseAlreadyEnrolledException extends AbstractException {
    constructor({
        courseId,
        userId,
        originalError,
    }: CourseAlreadyEnrolledExceptionMetadata) {
        super(
            "User is already enrolled in this course.",
            "COURSE_ALREADY_ENROLLED_EXCEPTION",
            {
                courseId,
                userId,
                originalError,
            },
        )
    }
}
