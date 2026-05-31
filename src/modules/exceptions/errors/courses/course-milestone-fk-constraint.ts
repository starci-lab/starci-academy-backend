import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link CourseMilestoneFKConstraintException}. */
export interface CourseMilestoneFKConstraintExceptionMetadata extends AbstractExceptionMetadata {
    /** Milestone row id from the seed payload. */
    milestoneId?: string
    /** Course id when partially present on the payload. */
    courseId?: string
}

/**
 * Thrown when a milestone seed row cannot be upserted because the parent course FK is missing.
 */
export class CourseMilestoneFKConstraintException extends AbstractException {
    constructor({
        milestoneId,
        courseId,
        originalError,
    }: CourseMilestoneFKConstraintExceptionMetadata) {
        super(
            "Milestone seed is missing course FK (course.id or courseId)",
            "COURSE_MILESTONE_FK_CONSTRAINT_EXCEPTION",
            {
                milestoneId,
                courseId,
                originalError,
            },
        )
    }
}
