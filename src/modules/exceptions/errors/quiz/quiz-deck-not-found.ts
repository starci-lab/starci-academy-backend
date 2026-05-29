import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link QuizDeckNotFoundException}. */
export interface QuizDeckNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the quiz deck that was looked up. */
    quizDeckId: string
}

/**
 * The requested quiz deck does not exist in the primary database.
 */
export class QuizDeckNotFoundException extends AbstractException {
    constructor(
        {
            quizDeckId,
            originalError,
        }: QuizDeckNotFoundExceptionMetadata,
    ) {
        super(
            `Quiz deck not found: ${quizDeckId}`,
            "QUIZ_DECK_NOT_FOUND_EXCEPTION",
            {
                quizDeckId,
                originalError,
            },
        )
    }
}
