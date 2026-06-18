import type {
    Locale,
} from "@modules/databases"

/**
 * The next interval (in days) each SM-2 grade would schedule a card to, computed
 * from its current scheduling state WITHOUT persisting — a preview for the
 * rating buttons so the learner sees the consequence of each choice.
 */
export interface FlashcardNextIntervals {
    /** Days until next review if graded Again (0). */
    again: number
    /** Days until next review if graded Hard (1). */
    hard: number
    /** Days until next review if graded Good (2). */
    good: number
    /** Days until next review if graded Easy (3). */
    easy: number
}

/**
 * One due flashcard for the spaced-repetition queue, already localized.
 */
export interface DueFlashcard {
    /** The card id. */
    cardId: string
    /** Owning deck title (localized). */
    deckTitle: string
    /** Card front / question (localized). */
    front: string
    /** Card back / answer (localized), or empty string when the card has none. */
    back: string
    /** Per-grade next-interval preview (days) from the card's current state. */
    nextIntervals: FlashcardNextIntervals
}

/**
 * The viewer's due-flashcard queue: the total due count plus the first page of
 * localized cards.
 */
export interface DueFlashcardsResult {
    /** Total number of due cards across the viewer's enrolled decks. */
    dueCount: number
    /** The first `limit` due cards, localized. */
    cards: Array<DueFlashcard>
}

/**
 * Params for listing a user's due flashcards.
 */
export interface ListDueFlashcardsParams {
    /** The viewer. */
    userId: string
    /** Max cards to return (the count is still the full total). */
    limit: number
    /** Locale to localize deck/card text into. */
    locale: Locale
}

/**
 * Params for applying an SM-2 review grade to one card.
 */
export interface ReviewFlashcardParams {
    /** The reviewer. */
    userId: string
    /** The card being graded. */
    cardId: string
    /** SM-2 grade: 0=Again, 1=Hard, 2=Good, 3=Easy. */
    grade: number
}

/**
 * One raw row from the due-card-id page query (`SELECT card.id AS card_id`).
 * Only the card id is selected so the full card graph can be loaded in one
 * follow-up batch.
 */
export interface DueCardIdRow {
    /** The due flashcard's id (raw `card_id` column alias). */
    card_id: string
    /** Prior ease factor from the left-joined review row (null = brand-new card). */
    review_ease: number | null
    /** Prior interval in days from the left-joined review row (null = brand-new card). */
    review_interval_days: number | null
    /** Prior repetition count from the left-joined review row (null = brand-new card). */
    review_repetitions: number | null
}

/**
 * Result of a review: when the card is next due.
 */
export interface ReviewFlashcardResult {
    /** When the card next becomes due. */
    dueAt: Date
}

/**
 * Params for the pure SM-2 update: the grade plus the prior scheduling state.
 */
export interface ApplySm2Params {
    /** SM-2 grade: 0=Again, 1=Hard, 2=Good, 3=Easy. */
    grade: number
    /** Ease factor from the previous review. */
    prevEase: number
    /** Interval (in days) from the previous review. */
    prevInterval: number
    /** Successful-repetition count from the previous review. */
    prevRepetitions: number
}

/**
 * Result of the pure SM-2 update: the next scheduling state.
 */
export interface ApplySm2Result {
    /** The next ease factor. */
    ease: number
    /** The next interval, in days. */
    intervalDays: number
    /** The next successful-repetition count. */
    repetitions: number
}
