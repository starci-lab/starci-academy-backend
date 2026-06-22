import type {
    FlashcardLevel,
    Locale,
} from "@modules/databases"

/** Params for {@link FlashcardDeckReadService.drawRandomCard}. */
export interface DrawRandomInterviewCardParams {
    /** Deck to draw a random gradable card from. */
    flashcardDeckId: string
    /** Locale to load + localize the drawn card in. */
    locale: Locale
    /** Optional seniority level to restrict the draw to (a deck mixes levels).
     * When set, only cards tagged with this level are eligible. */
    level?: FlashcardLevel | null
}
