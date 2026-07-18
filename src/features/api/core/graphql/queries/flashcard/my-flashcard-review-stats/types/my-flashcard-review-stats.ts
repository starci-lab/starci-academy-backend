/** Params for {@link import("../my-flashcard-review-stats.service").MyFlashcardReviewStatsService.compute}. */
export interface ComputeMyFlashcardReviewStatsParams {
    /** Viewer whose review stats are being aggregated. */
    userId: string
    /** Course to scope the aggregation to (resolves the same enrollment `startFlashcardReviewSession` draws against). */
    courseId: string
}

/** One tag's full review-retention breakdown, worst-first. */
export interface FlashcardWeakTagData {
    /** The technology tag (e.g. "NestJS"). */
    tag: string
    /** Retention for this tag = graded Good/Easy / total graded, 0..100. */
    retention: number
    /** Distinct cards (not reviews) carrying this tag that were graded at least once. */
    cardCount: number
}

/** One deck's review RETENTION (recalled/total) — the outcome analogue of the footprint `byDeck`. */
export interface FlashcardDeckRetentionData {
    /** The deck this retention is scoped to. */
    deckId: string
    /** The deck's title. */
    deckTitle: string
    /** Retention = graded Good/Easy / total graded for this deck, 0..100. */
    retention: number
    /** Total graded reviews for this deck. */
    reviewCount: number
}

/** A "leech FOCUS" card — the reason-tagged card the learner keeps forgetting or getting stuck on. */
export interface FlashcardLeechFocusCardData {
    /** The card id (open it in the reviewer). */
    cardId: string
    /** The card's question text (default-locale snapshot). */
    question: string
    /** Owning deck id (deep-link target). */
    deckId: string
    /** Owning deck title (default-locale snapshot). */
    deckTitle: string
    /** Times this card exhibited its `reason` (Again-after-a-prior-recall count, or repeated-Hard count). */
    lapseCount: number
    /** `"lapsed"` = forgot after once recalling it; `"stuckHard"` = repeatedly graded Hard, never Again but never firms up either. */
    reason: "lapsed" | "stuckHard"
}

/** The viewer's aggregated flashcard review stats for one course. */
export interface MyFlashcardReviewStatsResultData {
    /** Reason-tagged leech cards (lapsed vs stuck-on-Hard), worst first — the "viết lại" fix-list. */
    leechFocus: Array<FlashcardLeechFocusCardData>
    /** EVERY tag's review retention, worst first. */
    weakTags: Array<FlashcardWeakTagData>
    /** Review retention for cards with `interval_days >= 21` (recall on already-committed cards). */
    matureRetention: number
    /** Review retention for cards with `interval_days < 21` (recall while still spacing a card out). */
    youngRetention: number
    /** Graded review events for THIS COURSE only — course-scoped sibling of the per-user lifetime `totalReviewed`. */
    reviewedTotal: number
    /** Review retention for THIS COURSE only (0..100) — what the hero shows instead of lifetime `retentionRate`. */
    courseRetention: number
    /** Per-deck review retention (outcome), weakest first. */
    deckRetention: Array<FlashcardDeckRetentionData>
}
