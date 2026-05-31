import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link CourseQuizDeckFKConstraintException}. */
export interface CourseQuizDeckFKConstraintExceptionMetadata extends AbstractExceptionMetadata {
    /** Quiz deck row id from the seed payload. */
    quizDeckId?: string
    /** Course id when partially present on the payload. */
    courseId?: string
}

/**
 * Thrown when a quiz deck seed row cannot be upserted because the parent course FK is missing.
 */
export class CourseQuizDeckFKConstraintException extends AbstractException {
    constructor({
        quizDeckId,
        courseId,
        originalError,
    }: CourseQuizDeckFKConstraintExceptionMetadata) {
        super(
            "Quiz deck seed is missing course FK (course.id or courseId)",
            "COURSE_QUIZ_DECK_FK_CONSTRAINT_EXCEPTION",
            {
                quizDeckId,
                courseId,
                originalError,
            },
        )
    }
}
