import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when Regular tier is requested but `course.originalPrice` is missing or invalid. */
export interface CourseNoRegularPriceExceptionMetadata extends AbstractExceptionMetadata {
    courseId: string
}

/** Thrown when enrollment pricing uses Regular but the course has no valid list price. */
export class CourseNoRegularPriceException extends AbstractException {
    constructor({
        courseId,
        originalError,
    }: CourseNoRegularPriceExceptionMetadata) {
        super(
            "Course has no regular list price.",
            "COURSE_NO_REGULAR_PRICE_EXCEPTION",
            {
                courseId,
                originalError,
            },
        )
    }
}
