import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a course id does not exist. */
export interface CourseNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
    moduleId?: string
}

/** Thrown when no course matches the requested id. */
export class CourseNotFoundException extends AbstractException {
    constructor({
        id,
        displayId,
        moduleId,
        originalError,
    }: CourseNotFoundExceptionMetadata) {
        super(
            "Course not found",
            "COURSE_NOT_FOUND_EXCEPTION",
            {
                id,
                displayId,
                moduleId,
                originalError,
            },
        )
    }
}
