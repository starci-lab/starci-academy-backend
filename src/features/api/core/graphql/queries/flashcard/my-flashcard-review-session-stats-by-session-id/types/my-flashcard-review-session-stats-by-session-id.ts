/** Params for {@link import("../my-flashcard-review-session-stats-by-session-id.service").MyFlashcardReviewSessionStatsBySessionIdService.find}. */
export interface FindMyFlashcardReviewSessionStatsBySessionIdParams {
    /** Viewer the session (and every event aggregated) must belong to. */
    userId: string
    /** The review-session id to resolve + aggregate — resolved in EITHER session table (deck-review or cross-deck due-review). */
    sessionId: string
}

/** Per-SM-2-grade tally of the events graded within one session (grade 0/1/2/3). */
export interface FlashcardReviewSessionGradeCounts {
    /** Grade 0 — "Again" (forgot). */
    again: number
    /** Grade 1 — "Hard". */
    hard: number
    /** Grade 2 — "Good". */
    good: number
    /** Grade 3 — "Easy". */
    easy: number
}

/** One weak-tag row: a technology tag the learner forgot (graded "Again") on, with how many times. */
export interface FlashcardReviewSessionWeakTag {
    /** The technology tag (from the forgotten card's `tags`). */
    tag: string
    /** How many "Again" events in this session carried this tag. */
    forgotCount: number
}

/**
 * Computed per-session recap for ONE flashcard review session — the result of
 * {@link import("../my-flashcard-review-session-stats-by-session-id.service").MyFlashcardReviewSessionStatsBySessionIdService.find}.
 * `nextDueAt` is a `Date` here (the resolver serializes it to an ISO string).
 */
export interface MyFlashcardReviewSessionStatsBySessionIdResultData {
    /** Echoes the resolved session id. */
    sessionId: string
    /** The session's lifecycle state (resolved regardless of status). */
    status: "in_progress" | "completed" | "abandoned"
    /**
     * Total reviews attributed to this session — the count of
     * `flashcard_review_events` carrying this `sessionId`, or the session
     * entity's own `reviewedCount` fallback when no event carries the id
     * (degraded/legacy session).
     */
    reviewedCount: number
    /** Per-grade breakdown across this session's events (all zero in the degraded case). */
    gradeCounts: FlashcardReviewSessionGradeCounts
    /** Wall-clock span of the session (last − first event, seconds), or null when fewer than 2 events carry the id. */
    durationSeconds: number | null
    /** XP granted by this session's FIRST-EVER-review events (2 each); typically 0 for a due-review of already-seen cards. */
    xpEarned: number
    /** Earliest upcoming `dueAt` among the session's drawn cards, or null when none is scheduled. */
    nextDueAt: Date | null
    /** Top technology tags the learner forgot on this session (grade 0), most-forgotten first. */
    weakTags: Array<FlashcardReviewSessionWeakTag>
}
