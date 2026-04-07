import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a course translation row is missing for an update. */
export interface CourseTranslationNotFoundExceptionMetadata
    extends AbstractExceptionMetadata {
    courseId?: string
    locale?: string
    field?: string
}

/** Thrown when no previous course translation exists for the update path. */
export class CourseTranslationNotFoundException extends AbstractException {
    constructor({
        courseId,
        locale,
        field,
        originalError,
    }: CourseTranslationNotFoundExceptionMetadata) {
        super(
            "Course translation not found",
            "COURSE_TRANSLATION_NOT_FOUND_EXCEPTION",
            {
                courseId,
                locale,
                field,
                originalError,
            },
        )
    }
}
