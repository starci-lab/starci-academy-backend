/** Params for {@link import("../my-flashcard-quiz-session-by-session-id.service").MyFlashcardQuizSessionBySessionIdService.find}. */
export interface FindMyFlashcardQuizSessionBySessionIdParams {
    /** Viewer the session must belong to (owner-scoped via the session's enrollment.user). */
    userId: string
    /** The quiz-session id to resolve -- resolved REGARDLESS of status (completed/abandoned/in_progress). */
    sessionId: string
}

/** One weak-tag row snapshotted onto a finished quiz session, echoed verbatim from `flashcard_quiz_sessions.weak_tags`. */
export interface FlashcardQuizSessionWeakTag {
    /** The technology tag (e.g. "NestJS", "Redis") this coverage is scoped to. */
    tag: string
    /** This tag's coverage across the session's cards carrying it, 0..1. */
    coverage: number
    /** The single module this tag's cards map back to; null when the deck-to-module mapping is ambiguous. */
    moduleId: string | null
    /** The single content (lesson) this tag's cards map back to; null when the deck-to-content mapping is ambiguous. */
    contentId: string | null
}

/** One card's per-card outcome, echoed verbatim from `flashcard_quiz_sessions.results`. */
export interface FlashcardQuizSessionResult {
    /** The flashcard this answer belongs to (the FE re-fetches the card text separately by this id). */
    cardId: string
    /** How many cloze blanks on this card the learner filled correctly. */
    correctBlanks: number
    /** Total cloze blanks on this card (the denominator for this card's coverage). */
    totalBlanks: number
}

/**
 * The resolved recap for ONE flashcard quick-quiz session -- the
 * result of {@link import("../my-flashcard-quiz-session-by-session-id.service").MyFlashcardQuizSessionBySessionIdService.find}.
 * Everything is read straight off the snapshotted `flashcard_quiz_sessions` row
 * (NO recompute) -- the entity already persists coverage/xp/weakTags/results at
 * completion time.
 */
export interface MyFlashcardQuizSessionBySessionIdResultData {
    /** Echoes the resolved session id. */
    sessionId: string
    /** The session's lifecycle state (resolved regardless of status). */
    status: "in_progress" | "completed" | "abandoned"
    /** The practice mode chosen at setup. */
    mode: "quick" | "deep"
    /** The `FlashcardLevel` filter chosen at setup, or null for "all levels". */
    level: string | null
    /** Server-derived aggregate coverage (0..1), null until the session is completed. */
    coverage: number | null
    /** XP actually granted this session (post daily-cap clamp); 0 for a never-completed draw. */
    xpEarned: number
    /** Number of cards drawn for this session (= `card_ids.length`). */
    cardCount: number
    /** Number of cards answered so far (= `results.length`). */
    answeredCount: number
    /** Number of answered cards with EVERY cloze blank correct (`correctBlanks === totalBlanks`). */
    fullyCorrectCount: number
    /** Wall-clock span of the session (updatedAt − createdAt, seconds), or null when the row was never updated after creation. */
    durationSeconds: number | null
    /** Snapshot of the session's weak-tag ranking (verbatim from the row), empty when none. */
    weakTags: Array<FlashcardQuizSessionWeakTag>
    /** Per-card breakdown (verbatim from the row), empty when nothing was answered. */
    results: Array<FlashcardQuizSessionResult>
}
