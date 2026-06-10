import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link CourseFlashcardDeckFKConstraintException}. */
export interface CourseFlashcardDeckFKConstraintExceptionMetadata extends AbstractExceptionMetadata {
    /** Flashcard deck row id from the seed payload. */
    flashcardDeckId?: string
    /** Course id when partially present on the payload. */
    courseId?: string
}

/**
 * Thrown when a flashcard deck seed row cannot be upserted because the parent course FK is missing.
 */
export class CourseFlashcardDeckFKConstraintException extends AbstractException {
    constructor({
        flashcardDeckId,
        courseId,
        originalError,
    }: CourseFlashcardDeckFKConstraintExceptionMetadata) {
        super(
            "Flashcard deck seed is missing course FK (course.id or courseId)",
            "COURSE_FLASHCARD_DECK_FK_CONSTRAINT_EXCEPTION",
            {
                flashcardDeckId,
                courseId,
                originalError,
            },
        )
    }
}
