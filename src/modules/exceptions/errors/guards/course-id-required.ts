import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an enrollment-gated request missing the `x-course-id` header. */
export type CourseIdRequiredExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link GraphQLMustEnrolledGuard} when the request carries no
 * `x-course-id` header to check enrollment against.
 */
export class CourseIdRequiredException extends AbstractException {
    constructor({
        originalError,
    }: CourseIdRequiredExceptionMetadata) {
        super(
            "Course ID is required.",
            "COURSE_ID_REQUIRED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
