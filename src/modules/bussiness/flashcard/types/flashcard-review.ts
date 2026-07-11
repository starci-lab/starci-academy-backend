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
    /**
     * Today's actionable queue size = {@link dueReviewCount} + {@link newCount}
     * (overdue reviews + the capped new-card batch). The "đến hạn hôm nay"
     * headline — bounded, NOT the whole never-reviewed backlog.
     */
    dueCount: number
    /** Overdue review cards (reviewed once, now past `dueAt`). */
    dueReviewCount: number
    /** New cards offered today = `min(newTotalCount, DAILY_NEW_LIMIT)`. */
    newCount: number
    /** Total never-reviewed cards in the course (full new backlog). */
    newTotalCount: number
    /** The first `limit` due cards (overdue first, then today's new batch). */
    cards: Array<DueFlashcard>
}

/**
 * Params for listing a user's due flashcards.
 */
export interface ListDueFlashcardsParams {
    /** The viewer. */
    userId: string
    /** Owning course — when given, scope the queue to this course's decks only; omit for a global (cross-course) queue (e.g. dashboard). */
    courseId?: string
    /** Max cards to return (the count is still the full total). */
    limit: number
    /** Locale to localize deck/card text into. */
    locale: Locale
}

/**
 * Params for listing flashcards by an EXACT set of ids, regardless of their
 * current due status — used to rehydrate a resumable due-review batch to its
 * original draw (see {@link import("../flashcard-review.service").FlashcardReviewService.listByIds}).
 */
export interface ListFlashcardsByIdsParams {
    /** The viewer (for the review-row join → next-interval preview). */
    userId: string
    /** Owning course — scopes the review-row join by enrollment, mirrors {@link ListDueFlashcardsParams.courseId}. */
    courseId?: string
    /** The exact card ids to fetch, in caller order — preserved on output. */
    cardIds: Array<string>
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
