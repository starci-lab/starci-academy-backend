import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link FlashcardDeckPathNotFoundException}. */
export interface FlashcardDeckPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Zero-based deck index that could not be resolved on the mount. */
    flashcardDeckIndex: number
}

/**
 * No flashcard-deck path is available in the resolved `paths` list for the given index.
 */
export class FlashcardDeckPathNotFoundException extends AbstractException {
    constructor(
        {
            flashcardDeckIndex,
            originalError,
        }: FlashcardDeckPathNotFoundExceptionMetadata,
    ) {
        super(
            `Flashcard deck path not found for index ${flashcardDeckIndex}`,
            "FLASHCARD_DECK_PATH_NOT_FOUND_EXCEPTION",
            {
                flashcardDeckIndex,
                originalError,
            },
        )
    }
}
