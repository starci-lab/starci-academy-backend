import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link FlashcardDeckNotFoundException}. */
export interface FlashcardDeckNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the flashcard deck that was looked up. */
    flashcardDeckId: string
}

/**
 * The requested flashcard deck does not exist in the primary database.
 */
export class FlashcardDeckNotFoundException extends AbstractException {
    constructor(
        {
            flashcardDeckId,
            originalError,
        }: FlashcardDeckNotFoundExceptionMetadata,
    ) {
        super(
            `Flashcard deck not found: ${flashcardDeckId}`,
            "FLASHCARD_DECK_NOT_FOUND_EXCEPTION",
            {
                flashcardDeckId,
                originalError,
            },
        )
    }
}
