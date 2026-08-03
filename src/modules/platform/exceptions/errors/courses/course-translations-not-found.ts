import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when the previous course translations collection is missing. */
export interface CourseTranslationsNotFoundExceptionMetadata
    extends AbstractExceptionMetadata {
    courseId?: string
}

/** Thrown when previous course translations are undefined (e.g. not loaded). */
export class CourseTranslationsNotFoundException extends AbstractException {
    constructor({
        courseId,
        originalError,
    }: CourseTranslationsNotFoundExceptionMetadata = {
    }) {
        super(
            "Course translations not found",
            "COURSE_TRANSLATIONS_NOT_FOUND_EXCEPTION",
            {
                courseId,
                originalError,
            },
        )
    }
}
