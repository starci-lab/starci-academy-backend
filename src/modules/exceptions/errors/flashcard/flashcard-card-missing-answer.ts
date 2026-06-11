import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link FlashcardCardMissingAnswerException}. */
export interface FlashcardCardMissingAnswerExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the flashcard card that has no model answer. */
    flashcardCardId: string
}

/**
 * The flashcard card exists but has no model answer to grade against. Legacy
 * cards predating the Q&A format have a nullable `answer`, so interview grading
 * cannot build a rubric for them.
 */
export class FlashcardCardMissingAnswerException extends AbstractException {
    constructor(
        {
            flashcardCardId,
            originalError,
        }: FlashcardCardMissingAnswerExceptionMetadata,
    ) {
        super(
            `Flashcard card has no model answer to grade: ${flashcardCardId}`,
            "FLASHCARD_CARD_MISSING_ANSWER_EXCEPTION",
            {
                flashcardCardId,
                originalError,
            },
        )
    }
}
