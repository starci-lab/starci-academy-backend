import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link FlashcardCardNotFoundException}. */
export interface FlashcardCardNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the flashcard card that was looked up. */
    flashcardCardId: string
}

/**
 * The requested flashcard card does not exist in the primary database.
 */
export class FlashcardCardNotFoundException extends AbstractException {
    constructor(
        {
            flashcardCardId,
            originalError,
        }: FlashcardCardNotFoundExceptionMetadata,
    ) {
        super(
            `Flashcard card not found: ${flashcardCardId}`,
            "FLASHCARD_CARD_NOT_FOUND_EXCEPTION",
            {
                flashcardCardId,
                originalError,
            },
        )
    }
}
