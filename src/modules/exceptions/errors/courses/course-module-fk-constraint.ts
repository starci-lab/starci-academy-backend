import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link CourseModuleFKConstraintException}. */
export interface CourseModuleFKConstraintExceptionMetadata extends AbstractExceptionMetadata {
    /** Module row id from the seed payload. */
    moduleId?: string
    /** Course id when partially present on the payload. */
    courseId?: string
}

/**
 * Thrown when a module seed row cannot be upserted because the parent course FK is missing.
 */
export class CourseModuleFKConstraintException extends AbstractException {
    constructor({
        moduleId,
        courseId,
        originalError,
    }: CourseModuleFKConstraintExceptionMetadata) {
        super(
            "Module seed is missing course FK (course.id or courseId)",
            "COURSE_MODULE_FK_CONSTRAINT_EXCEPTION",
            {
                moduleId,
                courseId,
                originalError,
            },
        )
    }
}
