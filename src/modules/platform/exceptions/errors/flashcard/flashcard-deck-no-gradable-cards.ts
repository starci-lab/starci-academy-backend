import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link FlashcardDeckNoGradableCardsException}. */
export interface FlashcardDeckNoGradableCardsExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the flashcard deck that was drawn from. */
    flashcardDeckId: string
}

/**
 * The deck exists but holds no card with a model answer, so the interview mode
 * cannot draw a gradable question from it (legacy decks predating the Q&A
 * format have only nullable answers).
 */
export class FlashcardDeckNoGradableCardsException extends AbstractException {
    constructor(
        {
            flashcardDeckId,
            originalError,
        }: FlashcardDeckNoGradableCardsExceptionMetadata,
    ) {
        super(
            `Flashcard deck has no gradable cards: ${flashcardDeckId}`,
            "FLASHCARD_DECK_NO_GRADABLE_CARDS_EXCEPTION",
            {
                flashcardDeckId,
                originalError,
            },
        )
    }
}
