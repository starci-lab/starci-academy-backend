import type {
    Locale,
} from "@modules/databases"

/** Params for {@link FlashcardDeckReadService.drawRandomCard}. */
export interface DrawRandomInterviewCardParams {
    /** Deck to draw a random gradable card from. */
    flashcardDeckId: string
    /** Locale to load + localize the drawn card in. */
    locale: Locale
}
