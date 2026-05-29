import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link QuizCardNotFoundException}. */
export interface QuizCardNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the quiz card that was looked up. */
    quizCardId: string
}

/**
 * The requested quiz card does not exist in the primary database.
 */
export class QuizCardNotFoundException extends AbstractException {
    constructor(
        {
            quizCardId,
            originalError,
        }: QuizCardNotFoundExceptionMetadata,
    ) {
        super(
            `Quiz card not found: ${quizCardId}`,
            "QUIZ_CARD_NOT_FOUND_EXCEPTION",
            {
                quizCardId,
                originalError,
            },
        )
    }
}
